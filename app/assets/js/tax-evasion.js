    var numberFormat = d3.format("d");
    var acceptanceChart = dc.pieChart("#acceptance-chart");
    var dispatch = d3.dispatch('redraw');
    var monthHistChart = dc.barChart("#month_hist-chart");
    var messageHistChart = dc.barChart("#message_hist-chart");
    //assets/new_small_entities.csv
    //http://shrouded-shore-36178.herokuapp.com/entities/limit/1000000
    d3.csv("assets/merged.csv", function (csv) {
        var data = crossfilter(csv);
        var ab = data.dimension(function (d) {
            return d["ab"];
        });
        var message_length = data.dimension(function (d) {
            return d["m_first_message_length"];
        });

        var acceptance = data.dimension(function (d){
            return d["acceptance"];
        });


        var weekofyear = data.dimension(function (d){
            return d["week_of_year"];
        }); 

         var month = data.dimension(function (d){
            return d["month"];
        }); 
         var dayofweek = data.dimension(function (d){
            return d["day_of_week"];          
        }); 
     

        var inquiries_by_week = weekofyear.group().reduceCount();
        console.log(weekofyear.top(10));

        var inquiries_by_month = month.group().reduceCount();
        var inquiries_by_message= message_length.group().reduceCount();

        /*var countriesSum = countries.group().reduceSum(function (d) {
            if(d["countries"] != "") {
            return d["counter"];
            }
        });

*/
        var abRatio = ab.group().reduceCount();

        var acceptanceRatio = acceptance.group().reduceCount();
        
        d3.json("assets/countries.json", function (countriesJson) {


            monthHistChart
                .width(400)
                .height(250)
                .margins({top: 20, right: 50, bottom: 30, left: 50})
                .dimension(weekofyear)
                .group(inquiries_by_week)
                .centerBar(true)
                .elasticY(true)
                .yAxisPadding(0, 1)
                .xAxisLabel('     Week of 2013')
                .xAxisPadding(0.5)
                .x(d3.scale.linear().domain([0, 53]))
                .xUnits(dc.units.fp.precision(1))
                .colors(d3.scale.ordinal().range(["#f0ad9c"]));
            monthHistChart.yAxis().tickFormat(function (s) {
                return s ;
            });
            monthHistChart.xAxis().tickFormat(function (s) {
                return s ;
            });

            messageHistChart
                .width(400)
                .height(250)
                .margins({top: 20, right: 50, bottom: 30, left: 50})
                .dimension(message_length)
                .group(inquiries_by_message)
                .centerBar(true)
                .elasticY(true)
                .yAxisPadding(0, 1)
                .xAxisLabel('Message length')
                .xAxisPadding(0.5)
                .x(d3.scale.linear().domain([-15, 1500]))
                .xUnits(dc.units.fp.precision(30))
                .colors(d3.scale.ordinal().range(["#f0ad9c"]));
            messageHistChart.yAxis().tickFormat(function (s) {
                return s ;
            });
            messageHistChart.xAxis().tickFormat(function (s) {
                return s ;
            });


            acceptanceChart.width(200)
                      .height(250)
                      //.margins({top: 20, right: 1000})
                      .slicesCap(4)
                      .innerRadius(25)
                      .dimension(acceptance)
                      .group(acceptanceRatio)
                      .legend(dc.legend())
                      .colors(d3.scale.ordinal().range(["#2fd1c6", "#43bdb5", "#ff8c91", "#ff656b"]));

            //Round Chart 
                    var width = 960, height = 50;

                    var nodes = d3.range(200).map(function() { return {radius: Math.random() * 12 + 4}; }),
                            root = nodes[0];

                   //var nodes = g.selectAll('.node')
                    //.data(bubble.nodes({ children: countriesSum.all() }).filter(function(d) { return !d.children; }));
                           color = d3.scale.ordinal().range(["#2fd1c6", "#43bdb5", "#ff8c91", "#ff656b"]);

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

