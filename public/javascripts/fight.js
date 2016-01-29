if (window.console) {
    console.log("Welcome to your Play application's JavaScript!");
}

/********************************************
    Objects for tracking and re-using data 
*********************************************/
// object to map event_name => event_id
var eventNameIdMap = {};
// object for mapping fight_name => athletes data
var fightToAthleteData = {};


/************************************************
    On page-load => populate events drop down
*************************************************/
$(document).ready(function() {
    var getEventsCall = jsRoutes.controllers.StatsDatabase.getEvents(8);
    $.getJSON(
        getEventsCall.url,
        function(data, textStatus, xhr) {
            if(textStatus == "success") {
                $.each(data, function(index, value) {
                    // Create datalist option
                    $("#events").append("<option value='" + value["name"] + "'></option>");
                    // Add item to event name to ID map
                    eventNameIdMap[value["name"]] = value["id"];
                });
            }
            if(textStatus == "error") {
                alert("Error for getEvents: " + xhr.status + ": " + xhr.statusText);
            }
        }
    );
});


/***************************************************
    On event-selection => populate fights drop down
****************************************************/
function populateFights(eventName) {
    var eventId = eventNameIdMap[eventName];
    var getFightsCall = jsRoutes.controllers.StatsDatabase.getFights(eventId);
    $.getJSON(
        getFightsCall.url,
        function(data, textStatus, xhr) {
            if(textStatus == "success") {
                // Clear original list
                $("#fights").empty();
                $.each(data, function(index, value) {
                     createFightOption(value["id"], value["athlete1_id"], value["athlete2_id"]);
                });
            }
            if(textStatus == "error") {
                alert("Error for getFights: " + xhr.status + ": " + xhr.statusText);
            }
        }
    );
}

function createFightOption(fightId, athlete1Id, athlete2Id) {
    var getAthleteNamesCall = jsRoutes.controllers.StatsDatabase.getAthleteNames(fightId);
    $.getJSON(
        getAthleteNamesCall.url,
        function(data, textStatus, xhr) {
            if(textStatus == "success") {
                var fightName = data["athlete1"]+ " vs. " + data["athlete2"];
                fightToAthleteData[fightName] = {
                    "athlete1_id": athlete1Id,
                    "athlete1_name": data["athlete1"],
                    "athlete2_id": athlete2Id,
                    "athlete2_name": data["athlete2"],
                    "fight_id": fightId
                };

                // Create datalist option
                $("#fights").append(
                    "<option value='" + fightName + "'></option>"
                );
            }
            if(textStatus == "error") {
                alert("Error for getAthleteNames: " + xhr.status + ": " + xhr.statusText);
            }
        }
    );
}


/***************************************************
    Set fighter stats upon fight selection
****************************************************/
function populateAthleteStats(fightName) {

    // Get athlete 1 data
    var athlete1Id = fightToAthleteData[fightName]["athlete1_id"];
    var getAthleteCall1 = jsRoutes.controllers.StatsDatabase.getAthlete(athlete1Id);
    $.getJSON(
        getAthleteCall1.url,
        function(data, textStatus, xhr) {
            if(textStatus == "success") {
                // Set spans in athlete1_stats div
                $("#athlete1_stats span.fullname").text(data['fullname']);
                var record = data['wins'] + "-" + data['losses'];
                $("#athlete1_stats span.record").text(record);
                $("#athlete1_stats span.weight").text(data['weight_kg'] + "kg");
                $("#athlete1_stats span.height").text(data['height_cm'] + "cm");
            }
            if(textStatus == "error") {
                alert("Error for getFights: " + xhr.status + ": " + xhr.statusText);
            }
        }
    );

    // Get athlete 2 data
    var athlete2Id = fightToAthleteData[fightName]["athlete2_id"];
    var getAthleteCall2 = jsRoutes.controllers.StatsDatabase.getAthlete(athlete2Id);
    $.getJSON(
        getAthleteCall2.url,
        function(data, textStatus, xhr) {
            if(textStatus == "success") {
                // Set spans in athlete2_stats div
                $("#athlete2_stats span.fullname").text(data['fullname']);
                var record = data['wins'] + "-" + data['losses'];
                $("#athlete2_stats span.record").text(record);
                $("#athlete2_stats span.weight").text(data['weight_kg'] + "kg");
                $("#athlete2_stats span.height").text(data['height_cm'] + "cm");
            }
            if(textStatus == "error") {
                alert("Error for getFights: " + xhr.status + ": " + xhr.statusText);
            }
        }
    );

    // Pull fight odds
    var fightId = fightToAthleteData[fightName]["fight_id"];
    var athlete1Name = fightToAthleteData[fightName]["athlete1_name"];
    var athlete2Name = fightToAthleteData[fightName]["athlete2_name"];
    var getOddsCall = jsRoutes.controllers.StatsDatabase.getOdds(fightId);
    $.getJSON(
        getOddsCall.url,
        function(data, textStatus, xhr) {
            if(textStatus == "success") {
                // Set spans in athlete2_stats div
                var odds1 = data[athlete1Name];
                var odds2 = data[athlete2Name];
                if (odds1 > 0) odds1 = "+" + odds1;
                if (odds2 > 0) odds2 = "+" + odds2;
                $("#athlete1_stats span.odds").text(odds1);
                $("#athlete2_stats span.odds").text(odds2);
            }
            if(textStatus == "error") {
                alert("Error for getOdds: " + xhr.status + ": " + xhr.statusText);
            }
        }
    );
}

//Functions to support drag and drop functionality
$(function() {
    $("#selected_fight").draggable({
      opacity: 1.0,
      revert: true,
      revertDuration: 100,
      zIndex: 100
    });
    $("#add_fight_button").droppable({
      drop: function(event, ui) {
        var athlete1 = ui.draggable.find("#athlete1_stats");
        var athlete2 = ui.draggable.find("#athlete2_stats");
        var athleteName1 = athlete1.find(".fullname")[0].innerText;
        var athleteName2 = athlete2.find(".fullname")[0].innerText;
        addRowToPortfolio(athleteName1);
        addRowToPortfolio(athleteName2);
      }
    });
});

function addRowToPortfolio(athleteName) {
    var $row = $(".athlete_fight_row").first().clone();

    // Clear existing data and set Name
    $row.find(".athlete_name").html(athleteName);
    $row.find(".moneyline").empty();
    $row.find(".implied_prob").empty();
    $row.find(".wager").html("<div><span class='input-group-addon'>$</span><input type='text' size='5' onchange='updateWinProfit(this)'></div>");
    $row.find(".win_profit").empty();

    $row.appendTo("#portfolio_table");
}

// Add empty fight to the portfolio
function addFightToPortfolio() {
    // Add row for each athlete
    addRowToPortfolio("");
    addRowToPortfolio("");
}

// Update impiled probabilites based on moneylines
function updateImpliedProbabilites() {
    $(".athlete_fight_row").each(function(index) {
        var moneyline = $(this).find(".moneyline").text();
        var impliedProb = 1 / convertMoneylineToDecimal(moneyline);
        $(this).find(".implied_prob").text((100 * impliedProb).toFixed(2) + "%");
    });
    console.log("done");
}
// Run implied prob update on page load
updateImpliedProbabilites();

// Update fight portfolio row stats on changes in input fields
function updateWinProfit(inputElement) {
    var wager = parseFloat(inputElement.value);
    var $row = $(inputElement).closest(".athlete_fight_row");
    var moneyline = parseFloat($row.find(".moneyline")[0].innerText);
    var decimalOdds = convertMoneylineToDecimal(moneyline);
    var impliedProb = 1 / decimalOdds;
    var winProfit = wager * decimalOdds;
    $row.find(".implied_prob").text((100 * impliedProb).toFixed(2) + "%");
    $row.find(".win_profit").text("$" + winProfit.toFixed(2));
}

function convertMoneylineToDecimal(moneyline) {
    // ensure necessary string to float conversion
    moneyline = parseFloat(moneyline);
    if (moneyline < 0) {
        return (100 - moneyline) / -moneyline;
    }
    else if (moneyline > 0) {
        return (100 + moneyline) / 100;
    }
    else {
        alert("A moneyline of 0 is invalid!!");
    }
}
