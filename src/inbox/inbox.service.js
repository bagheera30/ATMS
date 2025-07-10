const { uploadToMinio } = require("../lib/minio");
const axios = require("axios");
const { upsertatribut } = require("./inbox.repository");
const createinbox = async (id, username, files) => {
  const camundaURL = process.env.URL_CAMUNDA;

  try {
    // 1. Get task and form variables
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

    // 2. Validate files
    if (!files || Object.keys(files).length === 0) {
      throw new Error("No files were uploaded");
    }
    const camundaVariables = {};

    let previousKey = null;

    for (const [key, variable] of Object.entries(formVariables)) {
      if (previousKey !== null && previousKey === previousKey) {
        camundaVariables[key] = variable;
        continue;
      }

      const file = files[key];
      const bucketName = `${process.env.MINIO_BUCKET_NAME}`;
      const objectName = `${businessKey}/${file.originalname}`;
      // Upload file to Minio
      await uploadToMinio(file.buffer, bucketName, objectName);
      await upsertatribut(
        { name: key },
        "",
        objectName,
        task.name,
        username,
        businessKey
      );
      variable.value = objectName;
      camundaVariables[key] = variable;
      previousKey = key;
    }

    // 4. Complete the task with updated variables
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
};

const resolve = async (id, files) => {
  const camundaURL = process.env.URL_CAMUNDA;

  try {
    // 1. Get task and form variables
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

    // 2. Validate files
    if (!files || Object.keys(files).length === 0) {
      throw new Error("No files were uploaded");
    }
    const camundaVariables = {};

    let previousKey = null;

    for (const [key, variable] of Object.entries(formVariables)) {
      if (previousKey !== null && previousKey === previousKey) {
        camundaVariables[key] = variable;
        continue;
      }

      const file = files[key];
      const bucketName = `${process.env.MINIO_BUCKET_NAME}`;
      const objectName = `${businessKey}/${file.originalname}`;
      // Upload file to Minio
      await uploadToMinio(file.buffer, bucketName, objectName);

      variable.value = objectName;
      camundaVariables[key] = variable;
      previousKey = key;
    }

    // 4. Complete the task with updated variables
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
  
}
module.exports = { createinbox, resolve };
