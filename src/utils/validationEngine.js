/**
 * Mandor-MES Validation Engine
 * Enforces variable rules (Regex, Required, Options) during App Runtime.
 */

export const validateVariable = (variable, value) => {
  const { name, type, validation } = variable;
  
  if (!validation) return { isValid: true };

  // 1. Required Check
  if (validation.required) {
    if (value === null || value === undefined || value === '') {
      return { 
        isValid: false, 
        message: `${name} is required.` 
      };
    }
  }

  // Skip further validation if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return { isValid: true };
  }

  // 2. Regex Validation
  if (validation.regex) {
    try {
      const re = new RegExp(validation.regex);
      if (!re.test(String(value))) {
        return { 
          isValid: false, 
          message: `${name} format is invalid. Expected: ${validation.regex}` 
        };
      }
    } catch (e) {
      console.error(`Invalid regex for variable ${name}:`, validation.regex);
    }
  }

  // 3. Options Validation (Enums)
  if (validation.options && validation.options.length > 0) {
    const options = Array.isArray(validation.options) 
      ? validation.options 
      : validation.options.split(',').map(o => o.trim());
      
    if (!options.includes(String(value))) {
      return { 
        isValid: false, 
        message: `${name} must be one of: ${options.join(', ')}` 
      };
    }
  }

  // 4. Type Specific Validation
  if (type === 'Number' || type === 'Integer') {
    if (isNaN(value)) {
      return { isValid: false, message: `${name} must be a number.` };
    }
    if (type === 'Integer' && !Number.isInteger(Number(value))) {
      return { isValid: false, message: `${name} must be an integer.` };
    }
  }

  return { isValid: true };
};

/**
 * Validates a collection of variables (e.g. for a whole Step)
 * @param {Array} variables - List of variable definitions
 * @param {Object} values - Current runtime values { varName: value }
 */
export const validateAllVariables = (variables, values) => {
  const errors = {};
  let isAllValid = true;

  variables.forEach(v => {
    const result = validateVariable(v, values[v.name]);
    if (!result.isValid) {
      errors[v.name] = result.message;
      isAllValid = false;
    }
  });

  return { isAllValid, errors };
};

/**
 * Resets variables based on 'clearOnCompletion' flag
 */
export const resetVariablesOnCompletion = (variables, currentValues) => {
  const newValues = { ...currentValues };
  
  variables.forEach(v => {
    if (v.clearOnCompletion) {
      newValues[v.name] = v.defaultValue || (v.type === 'Number' ? 0 : '');
    }
  });

  return newValues;
};
