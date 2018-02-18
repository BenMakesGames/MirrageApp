/**
 * @requires jsrender https://github.com/BorisMoore/jsrender
 * @requires MirrageApp
 */
class MirrageJsRender
{
    /**
     * @param {string} templateText
     * @return {object}
     */
    createTemplate(templateText)
    {
        return jQuery.templates(templateText);
    }

    /**
     * @param {object} template
     * @param data
     * @returns {string}
     */
    renderTemplate(template, data)
    {
        return template.render(data);
    }

    loadService(service)
    {
        if(typeof service.jsRender === 'undefined')
            return;

        if(typeof service.jsRender.converters !== 'undefined') {
            jQuery.views.converters(service.converters);
        }

        if(typeof service.jsRender.helpers !== 'undefined')
            jQuery.views.helpers(service.helpers);
    }
}