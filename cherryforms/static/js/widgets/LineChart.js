define(['underscore', 'core', 'highcharts', 'highcharts-exporting',
    'widgets/Chart'], function (_, CherryForms, Highcharts) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,

        LineChartField = Fields.LineChart = Fields.Chart.extend({
        }),

        LineChartWidget = Widgets.LineChart = Widgets.Chart.extend({
            FieldModel: LineChartField,

            getChartData: function () {
                var data = this.model.get('data'),
                    chartData, titles, categories, series, i;

                titles = data[0];
                categories = [];
                series = [];
                chartData = {
                    xAxis: {
                        title: titles[0],
                        categories: categories,
                        tickmarkPlacement: 'on',
                        labels: {
                            rotation: -45,
                            align: 'right'
                        }
                    },
                    series: series
                };

                _.each(titles.slice(1), function (title) {
                    series.push({
                        name: title,
                        data: []
                    });
                });

                _.each(data.slice(1), function (row) {
                    categories.push(row[0]);
                    for (i = 1; i < row.length; i++) {
                        series[i-1].data.push(row[i]);
                    }
                });

                return chartData;
            },

            getChartOptions: function () {
                return {
                    chart: {},
                    title: false,
                    subtitle: false,
                    tooltip: {
                        shared: true,
                        crosshairs: true
                    },
                    legend: {
                        layout: 'vertical', align: 'right', verticalAlign: 'top',
                        x: -10, y: 50, borderWidth: 0
                    }
                };
            },

            renderChart: function () {
                var chartOptions = _.extend(
                    this.getChartOptions(),
                    this.getChartData());
                this.$getChart().highcharts(chartOptions);
            }
        });
    return CherryForms;
});
