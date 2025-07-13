const { uploadToMinio, getPresignedUrl, preview } = require("../lib/minio");
const axios = require("axios");
const { upsertatribut } = require("./inbox.repository");
const camundaURL = process.env.URL_CAMUNDA;
const createinbox = async (id, username, files, bodyVariables) => {
  try {
    const [taskResponse, formVarsResponse] = await Promise.all([
      axios.get(`${camundaURL}/task/${id}`),
      axios.get(`${camundaURL}/task/${id}/form-variables`),
    ]);

    const task = taskResponse.data;
    const formVariables = formVarsResponse.data;

    const responprojek = await axios.get(
      `${camundaURL}/process-instance/${task.processInstanceId}`
    );
    const businessKey = responprojek.data.businessKey;

    if (!businessKey) {
      throw new Error("No businessKey found in the task");
    }

    const camundaVariables = {};

    // Process form variables
    for (const [key, variable] of Object.entries(formVariables)) {
      const nama = `${key}_${businessKey}`;
      let value = variable.value;

      // Check if this key has a corresponding file upload
      if (files[key]) {
        const file = files[key];
        const bucketName = `${process.env.MINIO_BUCKET_NAME}`;
        const objectName = `${businessKey}/${file.originalname}`;
        await uploadToMinio(file.buffer, bucketName, objectName);
        value = objectName;
        camundaVariables[key] = variable;
      } else if (bodyVariables[key]) {
        console.log(`bodyVariables[${key}].value`, bodyVariables[key]);
        camundaVariables[key] = bodyVariables[key];
        console.log(`value2`, camundaVariables[key]);
      } else {
        camundaVariables[key] = variable;
      }

      // Update the attribute with file info if available
      await upsertatribut(
        { name: nama },
        value,
        task.name,
        username,
        businessKey
      );
    }
    await axios.post(`${camundaURL}/task/${id}/complete`, {
      variables: camundaVariables,
    });

    return {
      success: true,
      message: "Task completed successfully",
      processedFiles: Object.keys(files).length,
      processedVariables: Object.keys(camundaVariables).length,
    };
  } catch (error) {
    console.error("Task completion failed:", error);
    throw new Error(`Task completion failed: ${error.message}`);
  }
};

const complate = async (id, username) => {
  try {
    const [taskResponse, formVarsResponse] = await Promise.all([
      axios.get(`${camundaURL}/task/${id}`),
      axios.get(`${camundaURL}/task/${id}/form-variables`),
    ]);
    const task = taskResponse.data;
    const formVariables = formVarsResponse.data;
    console.log("Form Variables:", formVariables);

    const responprojek = await axios.get(
      `${camundaURL}/process-instance/${task.processInstanceId}`
    );
    const businessKey = responprojek.data.businessKey;

    if (!businessKey) {
      throw new Error("No businessKey found in the task");
    }

    const camundaVariables = {};
    for (const [key, variable] of Object.entries(formVariables)) {
      const nama = `${key}_${businessKey}`;
      if (key === "requireDocument") {
        camundaVariables[key] = variable;
        continue;
      }
      await upsertatribut(
        { name: nama },
        variable.value,
        task.name,
        username,
        businessKey
      );
      camundaVariables[key] = variable;
    }
    await axios.post(`${camundaURL}/task/${id}/complete`, {
      variables: camundaVariables,
    });
    return {
      success: true,
      message: "success",
    };
  } catch (error) {
    console.error("Task completion failed:", error);
    throw new Error(`Task completion failed: ${error.message}`);
  }
};

const resolve = async (id, files) => {
  const camundaURL = process.env.URL_CAMUNDA;

  try {
    const [taskResponse, formVarsResponse] = await Promise.all([
      axios.get(`${camundaURL}/task/${id}`),
      axios.get(`${camundaURL}/task/${id}/form-variables`),
    ]);

    const task = taskResponse.data;
    const formVariables = formVarsResponse.data;
    console.log(formVariables);

    const responprojek = await axios.get(
      `${camundaURL}/process-instance/${task.processInstanceId}`
    );
    const businessKey = responprojek.data.businessKey;

    if (!businessKey) {
      throw new Error("No businessKey found in the task");
    }

    if (!files || Object.keys(files).length === 0) {
      throw new Error("No files were uploaded");
    }
    const camundaVariables = {};

    for (const [key, variable] of Object.entries(formVariables)) {
      if (files[key]) {
        console.log(key);
        const file = files[key];
        const bucketName = `${process.env.MINIO_BUCKET_NAME}`;
        const objectName = `${businessKey}/${file.originalname}`;
        await uploadToMinio(file.buffer, bucketName, objectName);
        variable.value = objectName;
        camundaVariables[key] = variable;
      } else {
        camundaVariables[key] = variable;
      }
    }
    console.log("list", camundaVariables);

    await axios.post(`${camundaURL}/task/${id}/resolve`, {
      variables: camundaVariables,
    });

    return {
      success: true,
      message: "success",
    };
  } catch (error) {
    console.error("File upload processing failed:", error);
    throw new Error(`Task completion failed: ${error.message}`);
  }
};

const downloadFile = async (filename) => {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME;
    const objectName = filename;
    const fileStream = await preview(bucketName, objectName);
    return fileStream;
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
};
module.exports = { createinbox, resolve, downloadFile, complate };
