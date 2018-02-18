/**
 * @requires doT https://github.com/olado/doT
 * @requires MirrageApp
 */
class MirrageDoT
{
    /**
     * @param {string} templateText
     * @return {function}
     */
    createTemplate(templateText)
    {
        return doT.template(templateText);
    }

    /**
     * @param {function} template
     * @param data
     * @returns {string}
     */
    renderTemplate(template, data)
    {
        return template(data);
    }

    loadService(service)
    {
        if(typeof service.doT === 'undefined')
            return;

        // TODO: converters? macros? anything like that?
    }
}