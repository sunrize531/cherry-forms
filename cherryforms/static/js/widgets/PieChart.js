define(['underscore', 'core', 'widgets/Chart'], function (_, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,
        vis = google.visualization,

        PieChartField = Fields.PieChart = Fields.Chart.extend({
        }),

        PieChartWidget = Widgets.PieChart = Widgets.Chart.extend({
            FieldModel: PieChartField,

            initChart: function () {
                return new vis.PieChart(this.$getChart());
            }
        });
    return CherryForms;
});
