import { Request } from "@egovernments/digit-ui-libraries";
import { parseXlsxToJsonMultipleSheetsForSessionUtil } from "../utils/exceltojson";
import { convertJsonToXlsx } from "../utils/jsonToExcelBlob";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import axios from "axios";
import shp from "shpjs";
import { EXCEL, GEOJSON, SHAPEFILE, ACCEPT_HEADERS } from "../configs/constants";

function handleExcelArrayBuffer(arrayBuffer, file) {
  return new Promise((resolve, reject) => {
    try {
      // Read the response as an array buffer
      // const arrayBuffer = response.arrayBuffer();

      // Convert the array buffer to binary string
      const data = new Uint8Array(arrayBuffer);
      const binaryString = String.fromCharCode.apply(null, data);

      // Parse the binary string into a workbook
      const workbook = XLSX.read(binaryString, { type: "binary" });

      // Assuming there's only one sheet in the workbook
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert the sheet to JSON object
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      resolve(jsonData);
    } catch (error) {
      reject(error);
    }
  });
}

function shpToGeoJSON(shpBuffer, file) {
  return new Promise((resolve, reject) => {
    try {
      shp(shpBuffer)
        .then((geojson) => {
          resolve({ jsonData: geojson, file });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}

function parseGeoJSONResponse(arrayBuffer, file) {
  return new Promise((resolve, reject) => {
    try {
      const decoder = new TextDecoder("utf-8");
      const jsonString = decoder.decode(arrayBuffer);
      const jsonData = JSON.parse(jsonString);
      resolve({ jsonData, file });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to read blob data and parse it into JSON
function parseBlobToJSON(blob, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const jsonData = {};

      workbook.SheetNames.forEach((sheetName) => {
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        jsonData[sheetName] = sheetData;
      });

      resolve({ jsonData, file });
    };

    reader.onerror = function () {
      reject(new Error("Error reading the blob data"));
    };

    reader.readAsArrayBuffer(blob);
  });
}

export const updateSessionUtils = {
  computeSessionObject: async (row, state, additionalPropsForExcel) => {
    const sessionObj = {};
    const setCurrentPage = () => {
      sessionObj.currentPage = {
        id: 0,
        name: "MICROPLAN_DETAILS",
        component: "MicroplanDetails",
        checkForCompleteness: true,
      };
    };

    //currently hardcoded
    const setMicroplanStatus = () => {
      sessionObj.status = {
        MICROPLAN_DETAILS: true,
        UPLOAD_DATA: true,
        HYPOTHESIS: true,
        FORMULA_CONFIGURATION: true,
      };
    };

    const setMicroplanDetails = () => {
      if (row.name) {
        sessionObj.microplanDetails = {
          name: row?.name,
        };
      }
    };

    const setMicroplanHypothesis = () => {
      if (row.assumptions.length > 0) {
        sessionObj.hypothesis = row.assumptions;
      }
    };

    const setMicroplanRuleEngine = () => {
      const rulesList = state.UIConfiguration?.filter((item) => item.name === "ruleConfigure")?.[0]?.ruleConfigureOperators;

      if (row.operations.length > 0) {
        sessionObj.ruleEngine = row.operations?.map((item) => {
          return {
            ...item,
            operator: rulesList.filter((rule) => rule.code === item.operator)?.[0]?.name,
          };
        });
      }
    };

    const setDraftValues = () => {
      sessionObj.planConfigurationId = row?.id;
      sessionObj.auditDetails = row.auditDetails;
    };

    const handleGeoJson = (file, result, upload) => {
      const { inputFileType, templateIdentifier, filestoreId } = file || {};

      upload[templateIdentifier] = {
        id: templateIdentifier,
        section: templateIdentifier,
        fileName: templateIdentifier,
        fileType: inputFileType,
        file: {},
        error: null,
        resourceMapping: row?.resourceMapping?.filter((resourse) => resourse.filestoreId === filestoreId),
        data: {},
      };

      upload[templateIdentifier].data = result;
      const newFeatures = result["features"].map((item) => {
        let newProperties = {};
        row?.resourceMapping
          ?.filter((resourse) => resourse.filestoreId === file.filestoreId)
          .forEach((e) => {
            newProperties[e["mappedTo"]] = item["properties"][e["mappedFrom"]];
          });
        item["properties"] = newProperties;
        return item;
      });
      upload[templateIdentifier].data.features = newFeatures;

      return upload;
    };

    const handleExcel = (file, result, upload) => {
      const { inputFileType, templateIdentifier, filestoreId } = file || {};

      upload[templateIdentifier] = {
        id: templateIdentifier,
        section: templateIdentifier,
        fileName: templateIdentifier,
        fileType: inputFileType,
        file: {},
        error: null,
        resourceMapping: row?.resourceMapping?.filter((resourse) => resourse.filestoreId === filestoreId),
        data: {},
      };

      const schema = state?.Schemas?.filter((schema) => {
        if (schema.type === inputFileType && schema.section === templateIdentifier && schema.campaignType === "ITIN") {
          return true;
        } else {
          return false;
        }
      })?.[0];
      if (!schema) {
        console.error("Schema got undefined while handling excel at handleExcel");
      }

      const resultAfterMapping = Digit.Utils.microplan.resourceMappingAndDataFilteringForExcelFiles(
        schema,
        additionalPropsForExcel.heirarchyData,
        {
          id: inputFileType,
        },
        result,
        additionalPropsForExcel.t
      );
      upload[templateIdentifier].data = resultAfterMapping?.tempFileDataToStore;
      upload[templateIdentifier].resourceMapping = resultAfterMapping?.tempResourceMappingData;
    };

    const fetchFiles = async () => {
      const files = row?.files;
      if (!files || files.length === 0) {
        return [];
      }

      const promises = [];
      files.forEach(({ filestoreId, inputFileType, templateIdentifier, id }) => {
        const promiseToAttach = axios
          .get("/filestore/v1/files/id", {
            responseType: "arraybuffer",
            headers: {
              "Content-Type": "application/json",
              Accept: ACCEPT_HEADERS[inputFileType],
              "auth-token": Digit.UserService.getUser()?.["access_token"],
            },
            params: {
              tenantId: Digit.ULBService.getCurrentTenantId(),
              fileStoreId: filestoreId,
            },
          })
          .then((res) => {
            if (inputFileType === EXCEL) {
              const file = new Blob([res.data], { type: ACCEPT_HEADERS[inputFileType] });
              return parseXlsxToJsonMultipleSheetsForSessionUtil(
                file,
                { header: 1 },
                {
                  filestoreId,
                  inputFileType,
                  templateIdentifier,
                  id,
                }
              );
            } else if (inputFileType === GEOJSON) {
              return parseGeoJSONResponse(res.data, {
                filestoreId,
                inputFileType,
                templateIdentifier,
                id,
              });
            } else if (inputFileType === SHAPEFILE) {
              const geoJson = shpToGeoJSON(res.data, {
                filestoreId,
                inputFileType,
                templateIdentifier,
                id,
              });
              return geoJson;
            }
          });
        promises.push(promiseToAttach);
      });

      const result = await Promise.all(promises);
      return result;
    };
    const setMicroplanUpload = async (filesResponse) => {
      //here based on files response set data in session
      if (filesResponse.length === 0) {
        return {};
      }
      //populate this object based on the files and return
      const upload = {};

      filesResponse.forEach(({ jsonData, file }, idx) => {
        switch (file.inputFileType) {
          case "Shapefile":
            handleGeoJson(file, jsonData, upload);
            break;
          case "Excel":
            handleExcel(file, jsonData, upload);
            break;
          case "GeoJSON":
            handleGeoJson(file, jsonData, upload);
          default:
            break;
        }
      });
      //here basically parse the files data from filestore parse it and populate upload object based on file type -> excel,shape,geojson
      return upload;
    };

    try {
      setCurrentPage();
      setMicroplanStatus();
      setMicroplanDetails();
      setMicroplanHypothesis();
      setMicroplanRuleEngine();
      setDraftValues();
      const filesResponse = await fetchFiles();
      const upload = await setMicroplanUpload(filesResponse); //should return upload object
      sessionObj.upload = upload;
      return sessionObj;
    } catch (error) {
      console.error(error.message);
    }
  },
};