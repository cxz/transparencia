queue()
    .defer(d3.csv, "/static/contratos-sample.csv")
    .await(makeCharts);

function makeCharts(error, records) {
    var inicioVigencia = "vigencia_inicio";
    var fornecedor = "fornecedor";
    var enquadramento = "processo_enquadramento";
    var situacao = "situacao";
    var contratoValorTxt = "contrato_valor_txt";
    var contratoAmount = "contrato_amount";

    var dateFormat = d3.time.format("%d/%m/%Y");

    records.forEach(function(d) {
        d[inicioVigencia] = dateFormat.parse(d[inicioVigencia]);
        d[inicioVigencia].setMinutes(0);
        d[inicioVigencia].setSeconds(0);
        d[contratoAmount] = parseFloat(d[contratoAmount]);
    });    

    //Create a Crossfilter instance
    var ndx = crossfilter(records);

    //Define Dimensions
    var dateDim = ndx.dimension(function(d) { return d[inicioVigencia]; });
    var fornecedorDim = ndx.dimension(function(d) { return d[fornecedor]; });
    var enquadramentoDim = ndx.dimension(function(d) { return d[enquadramento]; });
    var situacaoDim = ndx.dimension(function(d) { return d[situacao]; });
    var contratoAmountDim = ndx.dimension(function(d) { return d[contratoAmount] });

    var allDim = ndx.dimension(function(d) {return d;});

    //Group Data
    var numRecordsByDate = dateDim.group();
    var fornecedorGroup = fornecedorDim.group();
    var enquadramentoGroup = enquadramentoDim.group();
    var situacaoGroup = situacaoDim.group();

    var all = ndx.groupAll();

    //Define values (to be used in charts)
    //var minDate = dateDim.bottom(1)[0][inicioVigencia];
    //var maxDate = new Date(2018, 6, 1); //dateDim.top(1)[0][inicioVigencia];
    var minDate = new Date(2018, 0, 1);
    var maxDate = new Date(2018, 7, 1);
    var numberFormat = d3.format('.2f');

    var maxAmount = contratoAmountDim.top(1)[0][contratoAmount];

    var xMonths = ndx.dimension(function (d) {
        return d[inicioVigencia].getMonth();
    });

    var amountMonthInMM = xMonths.group().reduceSum(function (d) {
       return d[contratoAmount]/1e6;
    });

    var fornecedorContratoAmount = fornecedorDim.group().reduceSum(function (d) {
        return d[contratoAmount]/1e6;
    });

    var valorHistChart = dc.barChart("#valor-hist-chart")
        .width(600)
        .height(140)
        .dimension(xMonths)
        .group(amountMonthInMM)
        .renderLabel(true)
        .label(function (p) {
            return numberFormat(p.y);
        })
        .x(d3.scale.linear().domain([0, 11]))
        .y(d3.scale.linear())
            .outerPadding(10)
        //.yAxisLabel('Valor Bruto em MM')
        .elasticY(true)
        .brushOn(false)
        .xAxisPadding(50)
        .yAxis().tickFormat(function (v) {
            return v + '';
        }).ticks(5)
        ;

    var valorVigenciaChart = dc.barChart("#valor-vigencia-chart")
        .width(600)
        .height(140)
        .dimension(dateDim)
        .group(numRecordsByDate)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .yAxis().ticks(4)
    ;


    var quantitativoVigenciaChart = dc.barChart("#quantitativo-vigencia-chart")
        .width(600)
        .height(140)
        .dimension(dateDim)
        .group(numRecordsByDate)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .yAxis().ticks(4)
        ;

    var fornecedorChart = dc.rowChart("#fornecedor-row-chart")
        .width(600)
        .height(300)
        .dimension(fornecedorDim)
        .group(fornecedorContratoAmount)
        //.colors(['#6baed6'])
        .elasticX(true)
        .cap(10)
        ;

    var enquadramentoChart = dc.pieChart("#enquadramento-pie-chart")
        .width(300)
        .height(100)
        .dimension(enquadramentoDim)
        .group(enquadramentoGroup)
        .externalLabels(-50)        
        .legend(dc.legend().x(0))
        ;

    var situacaoChart = dc.pieChart("#situacao-pie-chart")
        .width(300)
        .height(100)
        .dimension(situacaoDim)
        .group(situacaoGroup)
        .externalLabels(-50)        
        .legend(dc.legend().x(0))    
        ;

    var dataTable = dc
        .dataTable("#valores-table")    
        .width(300)
        .height(480)
        .dimension(fornecedorDim)
        .group(function(d) { return ''; })
        .showGroups(false)
        .columns([
            { label: "Fornecedor", format: function(d) { return d[fornecedor]; } },
            { label: "Valor", format: function(d) { return d[contratoValorTxt]; } },
            { label: "Situação", format: function(d) { return d[situacao]; } }
         ])
        .sortBy(function (d) { return d.contrato_amount; })
        .order(d3.descending)
        .size(Infinity)
        ;    

    //see http://dc-js.github.io/dc.js/examples/table-pagination.html
    var firstRow = 0;
    var pageSize = 10;
    dataTable.beginSlice(firstRow);
    dataTable.endSlice(firstRow + pageSize);

    dc.renderAll();

};
