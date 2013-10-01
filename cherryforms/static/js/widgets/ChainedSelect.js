define(['underscore', 'utils', 'core', 'widgets/Select'], function(_, Utils, CherryForms){
    "use strict";

    /*************************************************
     *    var firstWidget = new ChainedSelectWidget({
     *       el: $('#project-select-cont'),
     *       choices: [
     *           {
     *               'value': 'proj1',
     *               'title': 'Project1',
     *           }
     *       ],
     *       value: 'proj1',
     *       unsetChoiceTitle: 'Select project'
     *   });
     *
     *   var secondWidget = new ChainedSelectWidget({
     *       el: $('#instance-select-cont'),
     *       unsetChoiceTitle: 'Select instance',
     *       chainedWidget: firstWidget,
     *       chainedChoices: {'proj1': [{'value': 'inst1', 'title': 'Instance 1'}]},
     *   });
     *
     *   firstWidget.render();
     *   secondWidget.render();
     *
     *   FormView.listenTo(firstWidget.choices, 'change:selected', redirect);
     #   FormView.listenTo(secondWidget.choices, 'change:selected', redirect);
     #
     #   redirect: function(){
     #       var project = this.firstWidget.getSelectedOption(), instance = this.secondWidget.getSelectedOption();
     #       if(!(_.isUndefined(project) || isUnset(project.get('value')) || _.isUndefined(instance) || isUnset(instance.get('value')))){
     #           document.location.href = '/project/'+ project.get('value') + '/' + instance.get('value') + '/';
     #       }
     #   }
     #
     *************************************************/

    var Widgets = CherryForms.Widgets,
        Templates = CherryForms.Templates,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Select = Widgets.Select,
        SelectField = Fields.Select,
        Unset = Utils.Unset,
        ChainedSelectTemplate = Templates.ChainedSelect = _.template('<select id="{{ input_id }}" class="{{ input_class }}"></select>'),

    ChainedSelectField = Fields.ChainedSelect = SelectField.extend({
        initialize: function () {
            var choices = this.choices = this._getChoices(this.get('choices'));
            this.addUnsetChoice();
            this.listenTo(choices, 'remove', this._onRemoveOption);
            this.listenTo(choices, 'change:selected', this._onSelectOption);
            Field.prototype.initialize.apply(this, arguments);
        },

        addUnsetChoice: function(){
            if (!this.get('not_null')) {
                this.choices.unshift([new Unset(), this.get('unsetChoiceTitle') || '-']);
            } else if (_.isNull(this.get('value')) || _.isUndefined(this.get('value'))) {
                this.set('value', this.choices.def().get('value'));
            }
        }

    }),

    ChainedSelectWidget = Widgets.ChainedSelect = Select.extend({
        FieldModel: ChainedSelectField,
        template: ChainedSelectTemplate,

        initialize: function() {
            Select.prototype.initialize.apply(this, arguments);

            var options = arguments[0] || {};

            this.chainedWidget = options.chainedWidget || null;
            this.chainedChoices = options.chainedChoices || [];
            this.selectedValue = options.selectedValue || -1;

            if (this.chainedWidget instanceof ChainedSelectWidget) {
                this.listenTo(this.chainedWidget.choices, 'change:selected', this.onChainedWidgetChange);

                // if something is selected already
                this.onChainedWidgetChange(this.chainedWidget.getSelectedOption());
                this.selectOptionByValue(this.selectedValue);
            }
        },

        onChainedWidgetChange: function(chainedOption) {
            var newChoices = this.chainedChoices[chainedOption.get('value')] || [];
            this.choices.map(this.detachOption, this);
            this.choices.reset();
            this.model.addUnsetChoice();
            this.choices.add(newChoices);
            this.choices.select(this.choices.first());
        },

        detachOption: function (option) {
            return this.$getOption(option).detach();
        },

        getSelectedOption: function(){
            return this.choices.selected();
        },

        selectOptionByValue: function(value){
            var choice = this.choices.find(function(choice){
                return choice.get('value') === value;
            });
            if(!_.isUndefined(choice)){
                this.choices.select(choice);
            }
        }
    });

    return CherryForms;
});