function drawNoVersions() {
  return $("<span>No versions</span>");
}

function drawVersionButton(time) {
  var b = $("<button>").addClass("versionButton").text(time);
  return b;
}

function drawVersionEntry(reviewsButton, versionButton) {
  return $("<div>").append(reviewsButton).append(versionButton);
}

function drawVersionsButton() {
  return $("<button>+</button>").addClass("versionsButton");
}

function setVersionsButtonPending(b) {
  b.html("<img src='/assets/spinner.gif'/>");
}

function setVersionsButtonReady(b) {
  b.text("+");
}

function drawVersionsContainer(versionsButton, versionsList) {
  return $("<div>")
    .append(versionsButton)
    .append($("<div>").addClass("clearfix"))
    .append(versionsList)
    .addClass("versionsContainer");
}

function drawVersionsList(visible, initialButtons) {
  var versions = $("<div>").css("display", visible ? "block" : "none");
  initialButtons.forEach(function(b) {
    versions.append(b);
  });
  return versions;
}

function drawLikertJustification() {
  return $("<div>")
    .append($("<h4>").text("Please briefly justify your score:"))
    .append($("<textarea>").addClass("likertText"));
}

var likertLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Slightly Agree",
    "Agree",
    "Strongly Agree"
  ];
function drawLikert(message, name) {
  var radioContainer = $("<div>");
  radioContainer.append($("<div>").text(message).addClass("reviewScoreMessage"));
  var rand = String(Math.random());
  likertLabels.forEach(function(l, ix) {
    var value = ix - (likertLabels.length / 2);
    var id = name + ix + rand;
    radioContainer.append(
      $("<span>")
        .addClass("likertButton")
        .append($("<input type='radio' id='" + id + "' name='" + name + "'>")
                .attr("value", value))
        .append($("<label for='" + id + "'>").text(l)));
  });
  return radioContainer;
}

function drawReviewScore(title, name, labels, values) {
  var radioContainer = $("<div>");
  radioContainer.append($("<div>").text(title + ":").addClass("reviewScoreTitle"));
  var id;
  _.times(labels.length, function (i) {
    id = name + i;
    radioContainer.append(
      $("<div>")
        .addClass("reviewButton")
        .append($("<label for='" + id + "'>").text(labels[i]))
        .append("<br>")
        .append($("<input type='radio' id='" + id + "' name='" + name + "'>")
                .attr("value", values[i])));
  });
  return radioContainer.addClass("reviewScore reviewScore-" + name);
}

function drawReviewTextSubmitContainer() {
  return $("<div>").addClass("reviewTextSubmit");
}

function getScore(reviewScore) {
  return reviewScore.find("input:checked").val();
}

function markInvalidReviewScore(reviewScore) {
  reviewScore.addClass('invalidScore');
}

function markOkReviewScore(reviewScore) {
  reviewScore.removeClass('invalidScore');
}

function selectReviewScore(reviewScore, value) {
  reviewScore.find("input[value=" + value + "]").click().prop("checked", true);
}

function drawShowWriteReview() {
  return $("<button>").css({float: "right"}).text("Review").addClass("writeReview");
}

function drawCodeRunButton() {
  return $("<button>").css({float: "right"}).text("Run");
}

function drawCodeReviewContainer() {
  return $("<div>").addClass("codeReviewContainer");
}

function drawReviewContainer() {
  return $("<div>").addClass("reviewContainer");
}

function drawWriteReviewContainer() {
  return $("<div>").addClass("reviewContainer");
}

function drawSubmitReviewButton() {
  return $("<button>")
    .text("Submit review")
    .css({float: 'right'})
    .addClass("submitReview");
}

function drawReviewText(enabled) {
  return $("<div>")
    .append($("<h4>").text("Comments:"))
    .append($("<textarea>")
            .addClass("reviewText")
            .prop("disabled", !enabled));
}

function disableReviewText(rt) {
  rt.find("textarea").prop("disabled", true);
}

function enableReviewText(rt) {
  rt.find("textarea").prop("disabled", false);
}

function disableReviewScore(score) {
  score.find("input").prop("disabled", true);
}

function setReviewText(rt, text) {
  rt.find("textarea").val(text);
}

function getReviewText(rt) {
  return rt.find("textarea").val();
}


function drawReviewsButton(count) {
  if (count === 0) {
    return $("<div></div>");
  }
  else {
    return $("<div>" + count + "*</div>")
      .attr("title", count + " reviews")
      .addClass("reviewLink");
  }
}

function drawReviewsDiv(name, time) {
  var rd = $("<div>");
  rd.append($("<h3>").text("Review for " + name + " at " + time));
  return rd;
}

function drawReviewsDivName(name, part) {
  var rd = $("<div>");
  rd.append($("<h3>").text("Review for " + part + " of " + name));
  return rd;
}

function drawReviewContainer() {
  return $("<div>");
}

function drawReview(revData, type) {
  var prompts = reviewStatements[type];
  function getLikertLabel(value) {
    return likertLabels[value + (likertLabels.length / 2)];
  }
  return $("<div>").addClass("reviewContents")
    .append($("<p>").text(statements[0] + getLikertLabel(revData.review.design)))
    .append($("<p>").text("Justification: " + revData.review.designComments))
    .append($("<p>").text(statements[1] + getLikertLabel(revData.review.correctness)))
    .append($("<p>").text("Justification: " + revData.review.correctnessComments));
}

function drawSavedNotification(container) {
  var saved = $("<span>Saved</span>");
  container.append(saved);
  saved.fadeOut(2000);
}

function drawNextStepButton() {
  return $("<button>").text("Next Step");
}

function drawStepsContainer() {
  return $("<div>").addClass("stepsContainer");
}

function drawStepButton(text) {
  return $("<button>").text(text);
}

function drawCurrentStepGutterMarker(isSubmittable) {
  var b = $("<span>").addClass("gutterButton active");
  b.text("→");
  return b;
}

function drawSubmitStepButton(stepName) {
  return $("<div>").addClass("submitStep").append($("<span>").text("submit " + stepName));
}

function drawSwitchToStepGutterMarker(n) {
  return $("<span>").addClass("gutterButton").text(n)[0];
}

function drawInactiveStepGutterMarker(n) {
  return $("<span>").addClass("gutterButton inactive").text(n)[0];
}

function drawProgressContainer() {
  return $("<div>").addClass("progressContainer");
}

function drawProgressStep(width) {
  return $("<span>").addClass("progressStep").css("width", width + "%");
}

function drawCurrentStepTitle() {
  return $("<h3>");
}

function setCurrentStepTitle(dom, title) {
  dom.text(title);
}

function drawEditorContainer() {
  return $("<div>").addClass("editorContainer");
}

function drawReviewsTab() {
  return $("<div>").addClass("reviewsTab");
}

function drawReviewEditorContainer() {
  return $("<div>").addClass("reviewEditorContainer");
}

function drawInstructionsWidget(html) {
  var visible = true;
  var instr = $("<div>")
    .addClass("toggleInstructions");
  function setInstrMessage() {
    if (visible) {
      instr.text("click to hide");
    } else {
      instr.text("click to show");
    }
  }
  setInstrMessage();

  var content = $("<div>")
    .addClass("instructionsContent")
    .html(html);

  var container = $("<div>")
    .addClass("instructionsWidget");

  var dom = container
    .append(instr)
    .append(content)
    .append($("<div>").addClass("clearfix"));

  dom.on("click", function () {
    if (visible) {
      visible = false;
      content.hide();
      setInstrMessage();
      container.addClass("hidden");
    } else {
      visible = true;
      content.show();
      setInstrMessage();
      container.removeClass("hidden");
    }
  });

  return dom;
}

function drawSaveContainer() {
  return $("<div>").addClass("saveIndicator");
}


function drawRunButton() {
  return $("<div>")
    .addClass("runButton")
    .addClass("blueButton")
    .html("run &rarr;");
}

function drawResetButton() {
  return $("<div>")
    .addClass("blueButton")
    .addClass("resetButton")
    .html("reset editor");
}

function drawClearFix() {
  return $("<div>").addClass("clearfix");
}

function drawErrorMessageWithLoc(message, link) {
  var errorMessage = $("<span>").text(message);
  return $("<div>").addClass("errorMessage")
    .append(link.addClass("errorLocation"))
    .append("<span>:&nbsp;</span>")
    .append(errorMessage);
}

function drawErrorLocations(links) {
  var container = $("<div>").addClass("errorLocations");
  links.forEach(function(l) {
    container.append($("<div>").addClass("errorLocation")
                               .append(l));
  })
  return container;
}


var dataCorrectStatement = "This data definition covers all the cases of data that it needs to represent.";
var dataDesignStatement = "This data definition is structured well and all the names are appropriate.";

var testsCorrectStatement = "These tests correctly reflect the desired behavior.";
var testsDesignStatement = "These tests are representative of the possible inputs.";

var funCorrectStatement = "This code correctly implements the desired behavior.";
var funDesignStatement = "This code is structured well."

var reviewStatements = {
  "fun-checks": [testsCorrectStatement, testsDesignStatement],
  "body": [funCorrectStatement, funDesignStatement],
  "data-checks": [dataCorrectStatement, dataDesignStatement]
};
