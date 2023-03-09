function addTitlesForIcons() {
    
    // Workplace
    d3.selectAll("#url\\(-clip9\\)")
    .append("text")
    .attr("id", "workplace-caption")
    .text("Workplace")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-size", 60)
    .attr("dx", 490)
    .attr("dy", 950)

// Grocery and pharmacy (Grocery)
d3.selectAll("#url\\(-clip12\\)")
    .append("text")
    .attr("id", "groceryAndPharmacy-caption")
    .text("Grocery")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-size", 60)
    .attr("dx", 2020)
    .attr("dy", 1360)

// Grocery and pharmacy (Pharmacy)
d3.selectAll("#url\\(-clip30\\)")
    .append("text")
    .attr("id", "groceryAndPharmacy-caption")
    .text("Pharmacy")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-size", 60)
    .attr("dx", 1430)
    .attr("dy", 2100)

// Retail
d3.selectAll("#url\\(-clip15\\)")
    .append("text")
    .attr("id", "residential-caption")
    .text("Residential")
    .attr("x", 30)
    .attr("font-size", 60)
    .attr("y", 30)
    .attr("dx", 2900)
    .attr("dy", 930)

// Park
d3.selectAll("#url\\(-clip6\\)")
    .append("text")
    .attr("id", "park-caption")
    .text("Park")
    .attr("x", 30)
    .attr("font-size", 60)
    .attr("y", 30)
    .attr("dx", 3300)
    .attr("dy", 2430)

// Residential areas
d3.selectAll("#url\\(-clip24\\)")
    .append("text")
    .attr("id", "retailAndRecreation-caption")
    .text("Retail and Recreation")
    .attr("x", 30)
    .attr("font-size", 60)
    .attr("y", 30)
    .attr("dx", 1100)
    .attr("dy", 2430)

}

