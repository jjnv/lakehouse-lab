import type { GuideCellSeed } from "../../builder";

export const startupErpNotebookGuidePart3 = [
  {"sourceIndex":15,"sourceDigest":"6e7eb6cea174e7c01ef173956f34b6fc705c0e1dc51df17e16bab9cad2851356","points":[{"title":"Atribuye uso y coste: Log generation metadata for cost tracking","what":"La celda calcula o prepara una atribuci\u00f3n de consumo mediante `spark.table`, `spark.conf.get`, `spark.databricks.clusterUsageTags.clusterId`, `generation_metadata`. El foco observable es \u00abLog generation metadata for cost tracking\u00bb; verifica su efecto y conserva la evidencia indicada. Se mantiene como demostraci\u00f3n: sus datos, escala o salidas no constituyen una receta de producci\u00f3n.","topic":"finops","status":"demo-only"}]},
] as const satisfies readonly GuideCellSeed[];
