# Agentes de Lakehouse Lab

Esta carpeta adapta `lakehouse-lab-agents.zip` al sistema nativo de agentes
personalizados de Codex. Su objetivo es que cada cambio tenga un propietario
claro, revisiones proporcionales al riesgo y evidencia verificable.

## Puesta en marcha

Codex carga `AGENTS.md`, `.codex/config.toml` y `.codex/agents/*.toml` al
iniciar una tarea o sesión en el repositorio.

Después de cambiar estos archivos:

1. Abre una tarea nueva o reinicia la sesión.
2. Comprueba la configuración con este prompt:

   ```text
   Resume las instrucciones activas de este repositorio y enumera los agentes
   especializados disponibles. No cambies ningún archivo.
   ```

3. Si la respuesta menciona las invariantes de Lakehouse Lab y los nueve
   perfiles, la configuración está activa.

## Modelo de trabajo

No necesitas elegir agentes para cada petición. `AGENTS.md` ya proporciona el
contexto estable del proyecto; el prompt solo debe explicar el resultado que
quieres conseguir.

| Situación | Uso recomendado |
|---|---|
| Copy, estilo o ajuste aislado | Hilo principal |
| Bug localizado | Especialista propietario |
| Funcionalidad con varias capas | Orquestador, propietario y un revisor |
| Sesión, privacidad o pérdida de datos | Propietario, Security y Quality |
| Migración | Data, Release y Quality |
| Revisión de rama | Revisores en paralelo, sin editar |

Los agentes son más útiles cuando sus tareas tienen fronteras claras. Si dos
agentes necesitan modificar el mismo archivo, deben trabajar en secuencia:
primero implementa el propietario y después revisan los especialistas.

## Plantilla de prompt

Una petición eficaz puede tener esta forma:

```text
Objetivo:
<resultado observable>

Fuera de alcance:
<lo que no debe cambiar>

Coordinación:
<propietario y revisores, si procede>

Criterios de aceptación:
- <comportamiento verificable>
- <ruta de error o límite>

Verificación:
<pruebas o comprobaciones esperadas>
```

No hace falta completar todos los campos. Lo más importante es definir el
resultado observable y cualquier restricción que no pueda inferirse del
repositorio.

## Flujo recomendado para una funcionalidad

### 1. Delimitar

```text
Usa lakehouse_orchestrator para convertir esta idea en un plan: objetivo,
alcance, fuera de alcance, riesgo, propietario, revisores, criterios de
aceptación y evidencia. No implementes todavía.
```

### 2. Implementar

```text
Implementa el plan aprobado con el agente propietario. Conserva los cambios que
ya existan en el workspace, añade pruebas proporcionales al riesgo y no
modifiques elementos fuera de alcance.
```

### 3. Revisar

```text
Cuando termine la implementación, pide a los revisores acordados que examinen
el diff. Deben buscar errores demostrables, no preferencias de estilo, y citar
archivo, escenario, impacto y regresión propuesta.
```

### 4. Cerrar

```text
Consolida el resultado: archivos modificados, comportamiento, pruebas
ejecutadas, resultados reales, cobertura omitida, riesgos residuales y
decisiones pendientes.
```

## Recetas listas para usar

### Corregir un bug de interfaz

```text
Corrige <problema reproducible>. Usa frontend_accessibility como propietario.
Mantén el contrato del servidor, cubre teclado, foco, carga y error cuando
proceda, añade una regresión y ejecuta las pruebas directamente relacionadas.
```

### Añadir o cambiar una API

```text
Implementa <caso de uso> con backend_domain_api como propietario. Define
entrada, salida y errores estables; conserva autenticación, idempotencia,
revisión y aislamiento. Después, quality_engineering revisa la cobertura y
frontend_accessibility comprueba la compatibilidad del consumidor.
```

### Cambiar sesión o privacidad

```text
Planifica y aplica <cambio>. Usa backend_domain_api como propietario. Haz que
security_privacy siga el flujo completo desde la entrada hasta almacenamiento
o salida y que quality_engineering añada pruebas de bypass, acceso horizontal
y regresión. Trabajad en fases si compartís archivos.
```

### Crear una migración

```text
Usa data_persistence como propietario de <cambio de modelo>. La migración debe
funcionar sobre base nueva y existente y tolerar una segunda ejecución.
release_performance revisa compatibilidad y rollback; quality_engineering
aporta la matriz de pruebas.
```

### Revisar contenido educativo

```text
Usa curriculum_assessments para revisar <módulo o banco>: objetivo, secuencia,
laboratorio, exactitud, preguntas, explicaciones, fuentes oficiales, IDs y
compatibilidad con progreso, intentos y credenciales. No cambies contratos ni
puntuación sin backend_domain_api.
```

### Revisar una rama sin modificarla

```text
Revisa esta rama contra main sin hacer cambios. Delega en security_privacy los
riesgos de acceso y exposición, en quality_engineering las regresiones y en
release_performance el build, las migraciones y el rendimiento. Consolida solo
hallazgos demostrables y ordénalos por severidad.
```

## Perfiles disponibles

| Perfil | Úsalo para |
|---|---|
| `lakehouse_orchestrator` | Delimitar y coordinar trabajo complejo |
| `product_ux` | Flujos, navegación, estados y microcopy |
| `frontend_accessibility` | React, Next.js, responsive y WCAG |
| `backend_domain_api` | APIs, dominio, progreso y concurrencia |
| `data_persistence` | Drizzle, Turso, consultas y migraciones |
| `security_privacy` | Sesión, permisos, privacidad y exposición |
| `curriculum_assessments` | Contenido, laboratorios y evaluaciones |
| `quality_engineering` | Pruebas, regresiones y aislamiento |
| `release_performance` | Build, Vercel, rendimiento y rollback |

## Cómo obtener mejores resultados

- Describe el problema con un ejemplo reproducible o un resultado observable.
- Indica lo que debe permanecer intacto cuando sea importante.
- Pide planificación antes de implementar si todavía hay decisiones abiertas.
- Limita las revisiones a uno o dos riesgos concretos.
- Usa paralelo para exploración y revisión independientes, no para editar los
  mismos archivos.
- Exige resultados reales de las pruebas y una lista explícita de lo no
  verificado.
- Convierte los errores recurrentes del agente en reglas duraderas de
  `AGENTS.md`.

## Problemas habituales

### Los perfiles no aparecen

Abre una tarea nueva o reinicia Codex desde la raíz del repositorio. Comprueba
que el repositorio está marcado como confiable y que `.codex/config.toml` y
`.codex/agents/` están presentes.

### Se lanzan demasiados agentes

Indica un propietario y un máximo de revisores:

```text
Usa solo backend_domain_api como propietario y security_privacy como único
revisor.
```

### Los agentes proponen cambios incompatibles

Pide al orquestador que compare contratos, identifique la decisión conflictiva
y prepare una secuencia. No permitas que ambos editen hasta resolverla.

### La revisión produce comentarios genéricos

Acota la superficie y exige evidencia:

```text
Revisa únicamente autorización e aislamiento en app/api/ y
app/enterprise/learning-service.ts. Devuelve solo hallazgos reproducibles con
archivo, flujo, impacto y prueba de regresión.
```
