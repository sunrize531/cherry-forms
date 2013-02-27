define(['underscore', 'core', 'highcharts', 'highcharts-exporting',
    'widgets/LineChart'], function (_, CherryForms, Highcharts) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,

        ColumnChartField = Fields.ColumnChart = Fields.LineChart.extend({
        }),

        ColumnChartWidget = Widgets.ColumnChart = Widgets.LineChart.extend({
            FieldModel: ColumnChartField,

            getChartOptions: function (container) {
                return {
                    chart: {
                        renderTo: container,
                        type: 'column'
                    },
                    title: false,
                    subtitle: false,
                    legend: {
                        layout: 'vertical', align: 'right', verticalAlign: 'top',
                        x: -10, y: 50, borderWidth: 0
                    }
                };
            }
        });
    return CherryForms;
});
