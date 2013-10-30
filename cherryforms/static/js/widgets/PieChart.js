define(['underscore', 'core', 'highcharts', 'highcharts-exporting',
    'widgets/Chart'], function (_, CherryForms, Highcharts) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,

        PieChartField = Fields.PieChart = Fields.Chart.extend({
        }),

        PieChartWidget = Widgets.PieChart = Widgets.Chart.extend({
            FieldModel: PieChartField,

            renderChart: function () {
                /*
                var chart = this.chart,
                    $chart = this.$getChart(),
                    data = this.model.get('data'),
                    chartOptions = {
                        chart: {
                            renderTo: this.$getChart()[0]
                        },
                        title: false,
                        subtitle: false
                    };


                chartOptions.series = [{
                    type: 'pie',
                    name: 'PieChart',
                    data: data.slice(1)
                }];

                try {
                    // This shit is glitching here, but continues to work anyway, so whatever...
                    this.chart = new Highcharts.Chart(chartOptions);
                } catch (e) {
                    console.error('Pie glitch', e, chartOptions);
                }
                */
            }
        });
    return CherryForms;
});
