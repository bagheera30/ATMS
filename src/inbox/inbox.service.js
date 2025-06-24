// const { default: axios } = require("axios");
// const { detectVariableType } = require("../lib/typecamund");
// const { upsertatribut } = require("./inbox.repository");

// class InboxService {
//   async createinbox(id, data, username, variables) {
//     const camundaURL = process.env.URL_CAMUNDA;
//     try {

//       const formcamunda= await axios.get(`${camundaURL}/task/${id}/form-variables`);
//       if (!variables || Object.keys(variables).length === 0) {
//         return res.status(400).json({ error: "Variables required" });
//       }
//       const camundaVariables = {};
//       for (const [key, value] of Object.entries(variables)) {
//         const type = detectVariableType(value);

//         camundaVariables[key] = { value, type };

//         // Handle khusus untuk tipe Object/JSON
//         if (type === "Object") {
//           camundaVariables[key].valueInfo = {
//             objectTypeName: "java.util.HashMap",
//             serializationDataFormat: "application/json",
//           };
//         }

//         // Handle khusus untuk tipe Date
//         if (value instanceof Date) {
//           camundaVariables[key].value = value.toISOString();
//         }
//       }

//       // 3. Kirim ke Camunda API
//       const response = await axios.post(
//         `
//       ${camundaURL}/task/${taskId}/complete`,
//         { variables: camundaVariables }
//       );
//       const uuid = "";
//       const task = await axios.get(`${camundaURL}/task/${id}`);
//       const atribut = await upsertatribut(
//         data,
//         uuid,
//         value,
//         task.data.name,
//         username,
//         task.data.businessKey
//       );

//       return {
//         success: true,
//         message: "Task completed",
//         data: response.data,
//       };
//     } catch (error) {
//       console.error(error);
//       throw error;
//     }
//   }
// }
// module.exports = inboxService;


// inbox.service.js
const { default: axios } = require("axios");
const { detectVariableType } = require("../lib/typecamund");
const { upsertatribut } = require("./inbox.repository");
const { uploadToMinio } = require("./minioClient");

class InboxService {
  async createinbox(id, username, variables, files) {
    const camundaURL = process.env.URL_CAMUNDA;
    
    try {
      // 1. Get form variables from Camunda
      const formVariablesResponse = await axios.get(`${camundaURL}/task/${id}/form-variables`);
      const formVariables = formVariablesResponse.data;
      
      if (!formVariables) {
        throw new Error("No form variables found in Camunda task");
      }

      // 2. Process variables and files
      const camundaVariables = {};
      const attributesToUpsert = [];

      // Check for required documents
      if (formVariables.requireDocument && files) {
        const requiredDocField = formVariables.requireDocument.value;
        
        if (requiredDocField && files[requiredDocField]) {
          const file = files[requiredDocField];
          const bucketName = "project-documents";
          const objectName = `${username}/${Date.now()}_${file.originalname}`;
          
          // Upload file to MinIO
          await uploadToMinio(file.buffer, bucketName, objectName);
          
          // Store in Camunda variables
          camundaVariables[requiredDocField] = {
            value: objectName,
            type: "String",
            valueInfo: {
              objectTypeName: "java.lang.String",
              fileInfo: {
                bucketName,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
              }
            }
          };

          // Prepare for database
          attributesToUpsert.push({
            data: { name: requiredDocField },
            value: objectName,
            type: "file"
          });
        }
      }

      // Process regular variables
      for (const [key, value] of Object.entries(variables || {})) {
        // Skip if this is a document field that was already processed
        if (formVariables.requireDocument && key === formVariables.requireDocument.value) {
          continue;
        }

        const type = detectVariableType(value);
        camundaVariables[key] = { value, type };

        // Special handling for complex types
        if (type === "Object") {
          camundaVariables[key].valueInfo = {
            objectTypeName: "java.util.HashMap",
            serializationDataFormat: "application/json",
          };
        }

        if (value instanceof Date) {
          camundaVariables[key].value = value.toISOString();
        }

        attributesToUpsert.push({
          data: { name: key },
          value: typeof value === 'object' ? JSON.stringify(value) : value,
          type
        });
      }

      // 3. Complete Camunda task
      const response = await axios.post(
        `${camundaURL}/task/${id}/complete`,
        { variables: camundaVariables }
      );

      // 4. Get task details
      const task = await axios.get(`${camundaURL}/task/${id}`);

      // 5. Upsert attributes to database
      const upsertPromises = attributesToUpsert.map(attr => 
        upsertatribut(
          attr.data,
          null,
          attr.value,
          task.data.name,
          username,
          task.data.businessKey
        )
      );

      await Promise.all(upsertPromises);

      return {
        success: true,
        message: "Task completed successfully",
        data: {
          ...response.data,
          uploadedDocuments: attributesToUpsert
            .filter(attr => attr.type === "file")
            .map(attr => ({
              fieldName: attr.data.name,
              objectName: attr.value
            }))
        },
      };
    } catch (error) {
      console.error("Error in createinbox:", error);
      throw new Error(`Failed to complete task: ${error.message}`);
    }
  }
}

module.exports = new InboxService();