# Política de seguridad

## Versiones mantenidas

El proyecto mantiene la rama principal y la versión desplegada más reciente.
Las ramas, forks y despliegues antiguos deben actualizarse antes de solicitar una
corrección.

## Cómo informar de una vulnerabilidad

No abras una incidencia pública con detalles explotables, credenciales, datos de
usuarios o una prueba de concepto activa.

Utiliza la función privada **Report a vulnerability** del repositorio:

https://github.com/jjnv/lakehouse-lab/security/advisories/new

Si el canal privado no estuviera disponible, comunica únicamente que necesitas
un canal de seguridad mediante el perfil del mantenedor, sin revelar detalles en
público.

Incluye, cuando sea posible:

- componente, ruta o commit afectado;
- impacto y condiciones necesarias;
- pasos mínimos de reproducción;
- evidencia o prueba de concepto no destructiva;
- mitigación sugerida;
- forma segura de contacto.

## Áreas especialmente sensibles

- aislamiento entre sesiones y usuarios;
- exportación, importación o eliminación de progreso;
- autorización de evaluaciones y credenciales;
- exposición anticipada de respuestas;
- SSRF, contenido ejecutable o bypasses en previews comunitarios;
- pérdida de datos, migraciones y reutilización de claves idempotentes;
- secretos, cookies o datos personales en logs y respuestas.

## Proceso

Los mantenedores intentarán confirmar la recepción, evaluar severidad y acordar
la divulgación de forma razonable. El tiempo de resolución depende del impacto y
de la disponibilidad de mantenedores; esta política no promete un SLA ni un
programa de recompensas.

Una corrección sensible puede desarrollarse de forma privada hasta que exista
una mitigación. Después se publicará información suficiente para que las personas
operadoras puedan actualizarse sin exponer datos innecesarios.

## Pruebas autorizadas

Limita las pruebas a cuentas, sesiones y datos propios. No interrumpas el servicio,
no accedas a información ajena, no realices ingeniería social y no ejecutes
escaneos destructivos.
