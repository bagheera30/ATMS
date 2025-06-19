const detectVariableType = (value) => {
  if (typeof value === "string") return "String";
  if (typeof value === "boolean") return "Boolean";
  if (Number.isInteger(value)) return "Integer";
  if (typeof value === "number") return "Double";
  if (value instanceof Date) return "Date";
  if (typeof value === "object") return "Object";
  return "String";
};

module.exports = { detectVariableType };
