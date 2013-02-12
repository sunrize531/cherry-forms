define(['underscore', 'core', 'widgets/Chart'], function (_, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,
        vis = google.visualization,

        LineChartField = Fields.LineChart = Fields.Chart.extend({
        }),

        LineChartWidget = Widgets.LineChart = Widgets.Chart.extend({
            FieldModel: LineChartField,

            initChart: function () {
                return new vis.LineChart(this.$getChart());
            }
        });
    return CherryForms;
});
