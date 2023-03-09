function setDefaultValues() {            
    
    d3.selectAll(imageMapping.transitStations)
            .selectAll("path")
            .attr("fill", "rgb(233, 233, 233)")

        d3.selectAll(imageMapping.groceryAndPharmacy)
            .selectAll("path")
            .attr("fill", "rgb(233, 233, 233)")

        d3.selectAll(imageMapping.retailAndRecreation)
            .selectAll("path")
            .attr("fill", "rgb(233, 233, 233)")


        d3.selectAll(imageMapping.workplace)
            .selectAll("path")
            .attr("fill", "rgb(233, 233, 233)")

        d3.selectAll(imageMapping.park)
            .selectAll("path")
            .attr("fill", "rgb(233, 233, 233)")

        d3.selectAll(imageMapping.residential)
            .selectAll("path")
            .attr("fill", "rgb(233, 233, 233)")
}
setDefaultValues();