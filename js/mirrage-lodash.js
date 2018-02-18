/**
 * Works with both Underscore and Lodash. If you need to reduce project size, MirrageLodash only requires _.template
 * and _.templateSettings (although I would caution that only very few setups would require such an optimization; if
 * you don't KNOW you need to reduce your project's file size, and you're just kind of thinking "man, wouldn't I be a
 * better programmer if I reduced the file size now?"... no: you probably wouldn't. Your time is almost certainly
 * better-spent elsewhere. Like by actually making the project you want/need to be making.)
 *
 * @requires _ https://github.com/lodash/lodash or https://github.com/jashkenas/underscore
 * @requires MirrageApp
 */
class MirrageLodash
{
    /**
     * @param {string} topLevelVariableName the name of the object which will contain data in templates. defaults to "rc".
     */
    constructor(topLevelVariableName)
    {
        if(typeof topLevelVariableName === 'undefined')
            topLevelVariableName = 'rc';
        else if(typeof topLevelVariableName !== 'string')
            throw 'topLevelVariableName must be a string, or omitted entirely (in which case it defaults to "rc")';

        _.templateSettings.variable = topLevelVariableName;
    }

    /**
     * @param {string} templateText
     * @return {function}
     */
    createTemplate(templateText)
    {
        return _.template(templateText);
    }

    /**
     * @param {function} template
     * @param data
     * @returns {string}
     */
    renderTemplate(template, data)
    {
        try
        {
            return template(data);
        }
        catch(e)
        {
            window.console.log('Warning: caught an exception while trying to render a template:');
            window.console.log(e);
            window.console.log(template.source);
            window.console.log(data);
            return '';
        }
    }

    loadService(service)
    {
        if(typeof service.underscore === 'undefined')
            return;

        // TODO: converters? macros? anything like that?
    }
}