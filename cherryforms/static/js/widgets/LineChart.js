define(['underscore', 'core', 'highcharts', 'widgets/Chart'], function (_, CherryForms, Highcharts) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,

        LineChartField = Fields.LineChart = Fields.Chart.extend({
        }),

        LineChartWidget = Widgets.LineChart = Widgets.Chart.extend({
            FieldModel: LineChartField,

            renderChart: function () {
                var chart = this.chart,
                    $chart = this.$getChart(),
                    data = this.model.get('data'),

                    chartData, titles, categories, series, i,
                    chartOptions;

                titles = data[0];
                categories = [];
                series = [];
                chartData = {
                    xAxis: {
                        title: titles[0],
                        categories: categories,
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


                if (!_.isUndefined(chart)) {
                    chart.destroy();
                    $chart.empty();
                }

                chartOptions = {
                    chart: {
                        renderTo: $chart[0]
                    },
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
                _.extend(chartOptions, this.options, chartData);
                this.chart = new Highcharts.Chart(chartOptions);
            }
        });
    return CherryForms;
});
