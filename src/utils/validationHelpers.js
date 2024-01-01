export function validatePixelVeeFile(data) {
  let missingProperties = []
  let invalidProperties = []

  // Check for existence
  if (!data.metadata) {
    missingProperties.push("metadata")
  } else {
    if (!data.metadata.version) {
      missingProperties.push("metadata.version")
    } else if (data.metadata.version === "1.0") {
      if (
        !data.metadata.application ||
        data.metadata.application !== "Pixel V"
      ) {
        invalidProperties.push("metadata.application")
      }
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
        "The JSON file is not a valid Pixel Vee save file. Missing properties: " +
        errors.join(", "),
    }
  }
  return { valid: true }
}
