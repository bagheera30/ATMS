const { default: axios } = require("axios");
const { upsertatribut } = require("./inbox.repository");
const { uploadToMinio } = require("../lib/minio");

class InboxService {
  async createinbox(id, username, files) {
    const camundaURL = process.env.URL_CAMUNDA;

    try {
      // 1. Get task and form variables
      const [taskResponse, formVarsResponse] = await Promise.all([
        axios.get(`${camundaURL}/task/${id}`),
        axios.get(`${camundaURL}/task/${id}/form-variables`),
      ]);

      const task = taskResponse.data;
      const formVariables = formVarsResponse.data;
      console.log(taskResponse.data.processInstanceId);
      const responprojek = await axios.get(
        `${camundaURL}/process-instance/${taskResponse.data.processInstanceId}`
      );
      const businessKey = responprojek.data.businessKey;
      console.log(businessKey);

      if (!businessKey) {
        throw new Error("No businessKey found in the task");
      }

      // 2. Validate files
      if (!files || Object.keys(files).length === 0) {
        throw new Error("No files were uploaded");
      }

      // 3. Process files
      const camundaVariables = {};
      const attributesToUpsert = [];
      const nameCounters = {}; // To track counts for each original filename

      for (const [fieldName, file] of Object.entries(files)) {
        // Process filename to add counter if needed
        const originalName = file.originalname;
        const extension = originalName.substring(originalName.lastIndexOf("."));
        const baseName = originalName.substring(
          0,
          originalName.lastIndexOf(".")
        );

        // Initialize or increment counter for this filename
        nameCounters[originalName] = (nameCounters[originalName] || 0) + 1;
        const counter =
          nameCounters[originalName] > 1 ? nameCounters[originalName] : "";

        const modifiedName = counter
          ? `${baseName}-${counter}${extension}`
          : originalName;

        const bucketName = process.env.MINIO_BUCKET_NAME || "project-documents";
        const objectName = `${businessKey}/${modifiedName}`;

        await uploadToMinio(file.buffer, bucketName, objectName);

        camundaVariables[fieldName] = {
          value: objectName,
          type: "String",
          valueInfo: {
            ...(formVariables[fieldName]?.valueInfo || {}),
            fileInfo: {
              filename: modifiedName, // Use the modified name here
              mimetype: file.mimetype,
              size: file.size,
              storagePath: objectName,
            },
          },
        };

        attributesToUpsert.push({
          field: fieldName,
          originalName: modifiedName, // Use the modified name here
          storagePath: objectName,
        });

        // Upsert to Neo4j for each file
        await upsertatribut(
          { name: fieldName },
          "", // let it generate new UUID
          objectName,
          task.name || task.taskDefinitionKey,
          username,
          businessKey
        );
      }

      // 4. Submit variables to Camunda
      await axios.post(`${camundaURL}/task/${id}/complete`, {
        variables: camundaVariables,
      });

      return {
        success: true,
        message: "File uploads processed and task completed successfully",
      };
    } catch (error) {
      console.error("File upload processing failed:", error);
      throw new Error(`Task completion failed: ${error.message}`);
    }
  }
}

module.exports = new InboxService();
