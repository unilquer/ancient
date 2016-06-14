    var numberFormat = d3.format("d");
    var worldChart = dc.geoChoroplethChart("#world-chart");
    var jurisChart = dc.pieChart("#juris-chart");
    var dispatch = d3.dispatch('redraw');
    var incropDateChart = dc.barChart("#incrop_date-chart");

    //assets/new_small_entities.csv
    //http://shrouded-shore-36178.herokuapp.com/entities/limit/1000000
    d3.csv("assets/new_small_entities.csv", function (csv) {
        var data = crossfilter(csv);
        var names = data.dimension(function (d) {
            return d["name"];
        });
        var jurisdiction_desc = data.dimension(function (d) {
            return d["jurisdiction_description"];
        });

        console.log(jurisdiction_desc.top(4));
        var internal_id = data.dimension(function (d){
            return d["internal_id"];
        });

        var incorporation_date = data.dimension(function (d){
            return d["incorporation_date"];
        });  

        var inactivation_date = data.dimension(function (d){
            return d["inactivation_date"];
        }); 

         var incorporation_year = data.dimension(function (d){
            return d["incorporation_year"];
        });       
        console.log(incorporation_year.top(10));

        var incorp_by_year = incorporation_year.group().reduceCount();
        console.log(incorp_by_year.top(10));

        var inactivation_year = data.dimension(function (d) {
          return d["inactivation_year"];
        })

        var inactivation_count = inactivation_year.group().reduceCount();

        var countries = data.dimension(function (d) {
            return d["countries"];
        });
        
        var countriesSum = countries.group().reduceSum(function (d) {
            if(d["countries"] != "") {
            return d["counter"];
            }
        });


        var jurisSum = jurisdiction_desc.group().reduceSum(function (d){
            if(d["jurisdiction_description"] != "Undetermined") {
                return d["counter"];
            }
        });

        var projection = d3.geo.equirectangular()
            .center([0,0])
            .scale(150)
            .rotate([-12,0]);
        
        d3.json("assets/countries.json", function (countriesJson) {
            worldChart.width(990)
                    .height(500)
                    .dimension(countries)
                    .group(countriesSum)
                    .colors(d3.scale.quantize().domain([0, 250]).range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
                    .colorDomain([0, 2000])
                    .colorCalculator(function (d) { return d ? worldChart.colors()(d) : '#ccc'; })
                    .overlayGeoJson(countriesJson.features, "state", function (d) {
                        return d.properties.name;
                    })
                    .title(function (d) {
                        return "Country: " + d.key + "\nNumber of Entities: " + numberFormat(d.value ? d.value : 0);
                    })
                    .projection(projection);

            incropDateChart
                .width(790)
                .height(250)
                .margins({top: 20, right: 50, bottom: 30, left: 50})
                .dimension(incorporation_year)
                .group(incorp_by_year)
                .centerBar(true)
                .elasticY(true)
                .yAxisPadding(0, 1)
                .xAxisLabel('Year')
                .xAxisPadding(0.5)
                .x(d3.scale.linear().domain([1980, 2016]))
                .xUnits(dc.units.fp.precision(0.8));
            incropDateChart.yAxis().tickFormat(function (s) {
                return s ;
            });
            incropDateChart.xAxis().tickFormat(function (s) {
                return s ;
            });

            jurisChart.width(200)
                      .height(250)
                      //.margins({top: 20, right: 1000})
                      .slicesCap(8)
                      .innerRadius(25)
                      .dimension(jurisdiction_desc)
                      .group(jurisSum)
                      .legend(dc.legend())
                      //.centerBar(true)
                      //.x(d3.scale.ordinal().domain(jurisdiction_desc))
                      //.xUnits(dc.units.ordinal);

           /** Bubble Chart **/
              var margin = {top: 0, right: 0, bottom: 0, left: 0}, 
              width = 690 - margin.left - margin.right, 
              height = 690 - margin.top - margin.bottom;
              var onClick;
              var color = d3.scale.category20c();
              
              var bubble = d3.layout.pack()
                .sort(null)
                .size([width, height])
                .padding(1.5);

              var t = d3.transition()
                 .duration(750);

              var svg = d3.select("#bubble-chart"),
                    g = svg.select('g');

              if (!svg.empty()) {
                svg.select('svg').remove()
              }

              g = svg.append('svg')
                  .attr('width', width + margin.left + margin.right)
                  .attr('height', height + margin.top + margin.bottom)
                  .attr('class', 'bubble')
                  .append('g')
                  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

              var reset = g.append('text')
                .attr('class', 'reset')
                .style('display', 'none')
                .attr('y', 5)
                .attr('x', 10)
                .text('reset')
                .on('click', click)

              function click(d) {

                countries.filter(d ? d.key : null);
                dispatch.redraw();

                svg.selectAll('circle').classed('active', false)
                if(!d) {
                  return reset.style('display', 'none');
                }
                svg.select('.' + btoa(d.key).replace(/=/g, '')).classed('active', true)
                reset.style('display', 'block')
              }

              var node = g.selectAll('.node')
                .data(bubble.nodes({ children: countriesSum.all() }).filter(function(d) { return !d.children; }))

              node.enter().append('g')
                .attr('class', 'node')
                .attr('transform', function(d) {return 'translate(' + d.x + ',' + d.y + ')'; });

              node.append('title')
                .text(function(d) { return d.key; });

              node.append('circle')
                .attr('class', function (d) { return btoa(d.key).replace(/=/g, '')})
                .attr('r', function(d) { return d.r; })
                .style('fill', function(d) { return color(d.key); })

              node.append('text')
                .attr('dy', '.3em')
                .attr('class', 'label')
                .style('text-anchor', 'middle')
                .text(function(d) { return d.key.substring(0, d.r / 4); })

                  dispatch.on('redraw.' + "#bubble-chart", function () {
                  var reset = g.selectAll('.reset')

                  node = g.selectAll('.node')
                    .data(bubble.nodes({ children: countriesSum.all() }).filter(function(d) { return !d.children; }))

                  node
                    .attr('class', 'node')
                    .transition(t)
                    .attr('transform', function(d) {return 'translate(' + d.x + ',' + d.y + ')'; });

                  node.select('circle')
                    .on('click', click)
                    .transition(t)
                    .attr('r', function(d) { return d.r; })
                    .style('fill', function(d) { return color(d.key); })

                  node.select('text')
                    .attr('dy', '.3em')
                    .style('text-anchor', 'middle')
                    .text(function(d) { return d.key.substring(0, d.r / 3); })
                    .on('click', click)

                })

            /**Round Chart **/
                    var width = 960, height = 50;

                    var nodes = d3.range(200).map(function() { return {radius: Math.random() * 12 + 4}; }),
                            root = nodes[0];

                   /* var nodes = g.selectAll('.node')
                    .data(bubble.nodes({ children: countriesSum.all() }).filter(function(d) { return !d.children; }));*/
                           color = d3.scale.category10();

                        root.radius = 0;
                        root.fixed = true;

                        var force = d3.layout.force()
                            .gravity(0.05)
                            .charge(function(d, i) { return i ? 0 : -2000; })
                            .nodes(nodes)
                            .size([width, height]);

                        force.start();

                        var svg = d3.select("#round-chart").append("svg")
                            .attr("width", width)
                            .attr("height", height);

                        svg.selectAll("circle")
                            .data(nodes.slice(1))
                          .enter().append("circle")
                            .attr("r", function(d) { return d.radius; })
                            .style("fill", function(d, i) { return color(i % 3); });

                        force.on("tick", function(e) {
                          var q = d3.geom.quadtree(nodes),
                              i = 0,
                              n = nodes.length;

                          while (++i < n) q.visit(collide(nodes[i]));

                          svg.selectAll("circle")
                              .attr("cx", function(d) { return d.x; })
                              .attr("cy", function(d) { return d.y; });
                        });

                        svg.on("mousemove", function() {
                          var p1 = d3.mouse(this);
                          root.px = p1[0];
                          root.py = p1[1];
                          force.resume();
                        });

                        function collide(node) {
                          var r = node.radius + 16,
                              nx1 = node.x - r,
                              nx2 = node.x + r,
                              ny1 = node.y - r,
                              ny2 = node.y + r;
                          return function(quad, x1, y1, x2, y2) {
                            if (quad.point && (quad.point !== node)) {
                              var x = node.x - quad.point.x,
                                  y = node.y - quad.point.y,
                                  l = Math.sqrt(x * x + y * y),
                                  r = node.radius + quad.point.radius;
                              if (l < r) {
                                l = (l - r) / l * .5;
                                node.x -= x *= l;
                                node.y -= y *= l;
                                quad.point.x += x;
                                quad.point.y += y;
                              }
                            }
                            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                          };
                        }



            dc.renderAll();
        });
    });

dispatch.redraw();
d3.select(self.frameElement).style("height", "738px");

/** CHORD CHART **/

var matrix = 
[
[368.0, 176.0, 128.0, 64.0, 720.0, 224.0, 176.0, 496.0, 128.0, 160.0, 144.0, 80.0, 272.0, 48.0, 160.0] ,
[391.0, 187.0, 136.0, 68.0, 765.0, 238.0, 187.0, 527.0, 136.0, 170.0, 153.0, 85.0, 289.0, 51.0, 170.0] ,
[529.0, 253.0, 184.0, 92.0, 1035.0, 322.0, 253.0, 713.0, 184.0, 230.0, 207.0, 115.0, 391.0, 69.0, 230.0] ,
[161.0, 77.0, 56.0, 28.0, 315.0, 98.0, 77.0, 217.0, 56.0, 70.0, 63.0, 35.0, 119.0, 21.0, 70.0] ,
[1702.0, 814.0, 592.0, 296.0, 3330.0, 1036.0, 814.0, 2294.0, 592.0, 740.0, 666.0, 370.0, 1258.0, 222.0, 740.0] ,
[345.0, 165.0, 120.0, 60.0, 675.0, 210.0, 165.0, 465.0, 120.0, 150.0, 135.0, 75.0, 255.0, 45.0, 150.0] ,
[230.0, 110.0, 80.0, 40.0, 450.0, 140.0, 110.0, 310.0, 80.0, 100.0, 90.0, 50.0, 170.0, 30.0, 100.0] ,
[644.0, 308.0, 224.0, 112.0, 1260.0, 392.0, 308.0, 868.0, 224.0, 280.0, 252.0, 140.0, 476.0, 84.0, 280.0] ,
[138.0, 66.0, 48.0, 24.0, 270.0, 84.0, 66.0, 186.0, 48.0, 60.0, 54.0, 30.0, 102.0, 18.0, 60.0] ,
[207.0, 99.0, 72.0, 36.0, 405.0, 126.0, 99.0, 279.0, 72.0, 90.0, 81.0, 45.0, 153.0, 27.0, 90.0] ,
[230.0, 110.0, 80.0, 40.0, 450.0, 140.0, 110.0, 310.0, 80.0, 100.0, 90.0, 50.0, 170.0, 30.0, 100.0] ,
[138.0, 66.0, 48.0, 24.0, 270.0, 84.0, 66.0, 186.0, 48.0, 60.0, 54.0, 30.0, 102.0, 18.0, 60.0] ,
[851.0, 407.0, 296.0, 148.0, 1665.0, 518.0, 407.0, 1147.0, 296.0, 370.0, 333.0, 185.0, 629.0, 111.0, 370.0] ,
[184.0, 88.0, 64.0, 32.0, 360.0, 112.0, 88.0, 248.0, 64.0, 80.0, 72.0, 40.0, 136.0, 24.0, 80.0] ,
[345.0, 165.0, 120.0, 60.0, 675.0, 210.0, 165.0, 465.0, 120.0, 150.0, 135.0, 75.0, 255.0, 45.0, 150.0] 
];

var chord = d3.layout.chord()
    .padding(.01)
    .sortSubgroups(d3.descending)
    .matrix(matrix);

var width = 690,
    height = 690,
    innerRadius = Math.min(width, height) * .44,
    outerRadius = innerRadius* 1.1;

var fill = d3.scale.category20c();

var svg = d3.select("#chord-chart").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.append("g").selectAll("path")
    .data(chord.groups)
  .enter().append("path")
  .attr("id", function(d, i){return "group-" + i;})
    .style("fill", function(d) { return fill(d.index); })
    .style("stroke", function(d) { return fill(d.index); })
    .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
    .on("mouseover", fade(.1))
    .on("mouseout", fade(1));
    
var country_labels = ['Panama', 'Luxembourg', 'Singapore', 'China', 'Hong Kong', 'United States', 'Guernsey', 'Switzerland', 'Russia', 'Jersey', 'IsleOfMan', 'URY', 'United Kingdom', 'Taiwan', 'Cyprus'];

svg.append("g").selectAll("text")
        .data(chord.groups)
    .enter()
    .append("sgv:text")
        .attr("dx", 1)
        .attr("dy", 15)

        //.style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .append("svg:textPath")
            .attr("xlink:href", function(d, i){return "#group-" + i;})
            .text(function(d,i) {return country_labels[i];});
            

var ticks = svg.append("g").selectAll("g")
    .data(chord.groups)
  .enter().append("g").selectAll("g")
    .data(groupTicks)
  .enter().append("g")
    .attr("transform", function(d) {
      return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
          + "translate(" + outerRadius + ",0)";
    });

ticks.append("line")
    .attr("x1", 1)
    .attr("y1", 0)
    .attr("x2", 5)
    .attr("y2", 0)
    .style("stroke", "#000");

ticks.append("text")
    .attr("x", 8)
    .attr("dy", ".35em")
    .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180)translate(-16)" : null; })
    .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
    .text(function(d) { return d.label; });

svg.append("g")
    .attr("class", "chord")
  .selectAll("path")
    .data(chord.chords)
  .enter().append("path")
    .attr("d", d3.svg.chord().radius(innerRadius))
    .style("fill", function(d) { return fill(d.target.index); })
    .style("opacity", 1);
    


// Returns an array of tick angles and labels, given a group.
function groupTicks(d) {
  var k = (d.endAngle - d.startAngle) / d.value;
  return d3.range(0, d.value, 1000).map(function(v, i) {
    return {
      angle: v * k + d.startAngle,
//      label: i % 2000 ? null : v / 1000
    };
  });
}

// Returns an event handler for fading a given chord group.
function fade(opacity) {
  return function(g, i) {
    svg.selectAll(".chord path")
        .filter(function(d) { return d.source.index != i && d.target.index != i; })
      .transition()
        .style("opacity", opacity);
  };
}