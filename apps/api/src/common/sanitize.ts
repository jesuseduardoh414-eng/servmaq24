import sanitizeHtml from 'sanitize-html';

/**
 * Limpia HTML que escribió alguien en quien NO confiamos (hoy: los vendedores del
 * marketplace).
 *
 * Por qué hace falta: la descripción del producto se pinta con `dangerouslySetInnerHTML`
 * en la ficha pública, que ve cualquier visitante y también el admin. Sin limpiarla, un
 * vendedor aprobado podía dejar ahí `<img src=x onerror="...">` y ejecutar código en el
 * navegador de todos — incluido el del admin, que tiene sesión abierta en el panel.
 *
 * Se permite solo formato de texto. Nada de `<script>`, `<iframe>`, `<style>`, ni
 * atributos `on*`, ni `href="javascript:"`: `sanitize-html` trabaja con lista blanca,
 * así que lo que no está aquí se cae solo (no hay que ir adivinando qué prohibir).
 *
 * Los datos reales de hoy son texto plano (0 de 27 descripciones traen etiquetas), así
 * que esto no cambia cómo se ve nada: solo tapa el agujero.
 */
export function sanitizeUserHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h3', 'h4', 'span', 'a'],
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
    // Sin esto, `href="javascript:..."` seguiría siendo un vector.
    allowedSchemes: ['http', 'https', 'mailto'],
    // Un enlace del vendedor no debe poder tocar la pestaña que lo abrió (tabnabbing).
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'nofollow noopener noreferrer', target: '_blank' }),
    },
    disallowedTagsMode: 'discard',
  });
}
