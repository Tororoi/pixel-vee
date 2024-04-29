/**
 * Validate the data of a Pixel Vee save file
 * @param {object} data - The data to be validated
 * @returns {object} - validation object
 */
export function validatePixelVeeFile(data) {
  let missingProperties = []
  let invalidProperties = []

  // Check for existence
  if (!data.metadata) {
    missingProperties.push("metadata")
  } else {
    if (!data.metadata.version) {
      missingProperties.push("metadata.version")
    } else {
      if (!["1.0", "1.1"].includes(data.metadata.version)) {
        invalidProperties.push("metadata.version")
      }
      if (data.metadata.version === "1.1") {
        if (!data.vectors) {
          missingProperties.push("vectors")
          //TODO: (Low Priority) Add message: Expected vectors array in version 1.1 file
        } else if (!Array.isArray(data.vectors)) {
          invalidProperties.push("vectors")
        }
      }
    }
    if (!data.metadata.application || data.metadata.application !== "Pixel V") {
      invalidProperties.push("metadata.application")
    }
    if (!data.metadata.timestamp) {
      missingProperties.push("metadata.timestamp")
    }
  }
  if (!data.layers) {
    missingProperties.push("layers")
  } else if (!Array.isArray(data.layers)) {
    invalidProperties.push("layers")
  }
  if (!data.history) {
    missingProperties.push("history")
  } else if (!Array.isArray(data.history)) {
    invalidProperties.push("history")
  }

  // Generate error messages
  let errors = []
  if (missingProperties.length > 0) {
    errors.push("Missing properties: " + missingProperties.join(", "))
  }
  if (invalidProperties.length > 0) {
    errors.push("Invalid properties: " + invalidProperties.join(", "))
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message:
        "The JSON file is not a valid Pixel Vee save file. " +
        errors.join(", "),
    }
  }
  return { valid: true }
}
