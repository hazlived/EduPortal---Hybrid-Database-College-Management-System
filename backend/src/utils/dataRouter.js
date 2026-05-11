// Simple data routing decision helper
const TARGETS = {
  SQL: 'sql',
  MONGO: 'mongo',
  BOTH: 'both',
};

function decideTarget({ fixedSchema, hasRelations, isLog, isFile, affectsBoth }) {
  if (affectsBoth) return TARGETS.BOTH;
  if (fixedSchema || hasRelations) return TARGETS.SQL;
  if (isLog || isFile) return TARGETS.MONGO;
  return TARGETS.SQL;
}

module.exports = { TARGETS, decideTarget };
