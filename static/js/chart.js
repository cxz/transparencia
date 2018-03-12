queue()
    .defer(d3.csv, "/static/contratos-sample.csv")
    .await(makeGraphs);

function makeGraphs(error, records) {
    var inicioVigencia = "vigencia_inicio";
    var fornecedor = "fornecedor";
    var enquadramento = "processo_enquadramento";
    var situacao = "situacao";
    var valorContrato = "contrato_valor_txt";

    var dateFormat = d3.time.format("%d/%m/%Y");

    records.forEach(function(d) {
        d[inicioVigencia] = dateFormat.parse(d[inicioVigencia]);
        d[inicioVigencia].setMinutes(0);
        d[inicioVigencia].setSeconds(0);
    });    

    //Create a Crossfilter instance
    var ndx = crossfilter(records);

    //Define Dimensions
    var dateDim = ndx.dimension(function(d) { return d[inicioVigencia]; });
    var fornecedorDim = ndx.dimension(function(d) { return d[fornecedor]; });
    var enquadramentoDim = ndx.dimension(function(d) { return d[enquadramento]; });
    var situacaoDim = ndx.dimension(function(d) { return d[situacao]; });
    var valoresDim = ndx.dimension(function(d) { return d[fornecedor] });

    var allDim = ndx.dimension(function(d) {return d;});

    //Group Data
    var numRecordsByDate = dateDim.group();
    var fornecedorGroup = fornecedorDim.group();
    var enquadramentoGroup = enquadramentoDim.group();
    var situacaoGroup = situacaoDim.group();
    var valoresGroup = valoresDim.group();

    var all = ndx.groupAll();

    //Define values (to be used in charts)
    var minDate = dateDim.bottom(1)[0][inicioVigencia];
    var maxDate = dateDim.top(1)[0][inicioVigencia];

    //Charts
    var timeChart = dc.barChart("#time-chart");
    var fornecedorChart = dc.rowChart("#fornecedor-row-chart");
    var enquadramentoChart = dc.pieChart("#enquadramento-pie-chart");

    timeChart
        .width(600)
        .height(140)
        //.margins({top: 10, right: 50, bottom: 20, left: 20})
        .dimension(dateDim)
        .group(numRecordsByDate)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .yAxis().ticks(4);

    fornecedorChart
        .width(600)
        .height(500)
        .dimension(fornecedorDim)
        .group(fornecedorGroup)
        .colors(['#6baed6'])
        .elasticX(true)
        .cap(20)
        ;

    enquadramentoChart
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
        .dimension(valoresDim)
        .group(function(d) { return d.value })
        .showGroups(false)
        .columns([
            { label: "Fornecedor", format: function(d) { return d[fornecedor]; } },
            { label: "Valor", format: function(d) { return d[valorContrato]; } },
            { label: "Situação", format: function(d) { return d[situacao]; } },
         ])
        ;    

    dc.renderAll();

};
