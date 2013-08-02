"use strict";
var LOG = true;
function merge(obj, extension) {
  return _.merge(_.clone(obj), extension);
}

function ct_log(/* varargs */) {
  if (window.console && LOG) {
    console.log.apply(console, arguments);
  }
}
function ct_error(/* varargs */) {
  if (window.console && LOG) {
    console.error.apply(console, arguments);
  }
}

var NO_INSTANCE_DATA = {no_instance_data: true};

var rails_host = RAILS_HOST;

function clean(str) {
  return str.replace(/^\n/, "");//.replace(/\n+$/, "");
}

var AUTOSAVE_ENABLED = true;
var COUNTER = 0;

// global used for walking page finding pieces of code
var ASSIGNMENT_PIECES = [];

function getPreludeFor(id) {
  var prelude = "";
  for (var i = 0; i < ASSIGNMENT_PIECES.length; i++) {
    if (ASSIGNMENT_PIECES[i].id === id) {
      break;
    }
    var piece = ASSIGNMENT_PIECES[i];
    if (piece.mode === "include" || piece.mode === "include-run") {
      if (piece.code) {
        prelude += piece.code;
      } else if (piece.editor) {
        prelude += piece.editor.getValue();
      }
      prelude += "\n\n";
    }
  }

  return prelude;
}

function lookupResource(resource, present, absent, error) {
  if (typeof error === 'undefined') {
    error = function(xhr, e) {
      ct_error("lookupResource failed:", resource, xhr, e);
    }
  }
  $.ajax(rails_host + '/resource/lookup?resource=' + resource, {
    success: function(response, _, xhr) {
      present(response);
    },
    error: function(xhr, errorMsg) {
      if (xhr.status === 404) {
        ct_log("Not found (expected): ", resource, xhr);
        absent();
      } else {
        error(xhr, errorMsg);
      }
    }
  });
}

function lookupVersions(resource, callback, error) {
  if (typeof error === 'undefined') {
    error = function(xhr, e) {
      ct_error("lookupVersions failed:", resource, xhr, e);
    }
  }
  $.ajax(rails_host + '/resource/versions?resource=' + resource, {
    success: function(response, _, xhr) {
      callback(response);
    },
    error: function(xhr, errorMsg) {
      if (xhr.status === 404) {
        callback([]);
      } else {
        error(xhr, errorMsg);
      }
    }
  });
}

function lookupReview(lookupLink, success, error) {
  if (typeof error === 'undefined') {
    error = function(xhr, e) { console.error(xhr, e); }
  }
  $.ajax(lookupLink, {
    success: function(response, _, xhr) {
      success(response);
    },
    error: error
  });
}

function submitResource(resource, type, success, failure) {
  if (typeof success === 'undefined') { success = function() {}; }
  if (typeof failure === 'undefined') {
    failure = function(xhr, e) {
      ct_error(xhr, e);
    };
  }
  $.ajax(rails_host + "/resource/submit?resource=" + resource, {
    data: { data: JSON.stringify({step_type: type}) },
    success: function(response, _, xhr) {
      success(response);
    },
    error: failure,
    type: "POST"
  });
}

function saveResource(resource, data, success, failure) {
  if (typeof success === 'undefined') { success = function() {}; }
  if (typeof failure === 'undefined') {
    failure = function(xhr, e) {
      ct_error(xhr, e);
    };
  }
  $.ajax(rails_host + "/resource/save?resource=" + resource, {
         data: {data: JSON.stringify(data)},
         success: function(response, status, xhr) { success(response); },
         error: failure,
         type: "POST"});
}

function saveReview(saveLink, data, success, failure) {
  if (typeof success === 'undefined') { success = function() {}; }
  if (typeof failure === 'undefined') {
    failure = function(xhr, e) {
      ct_error(xhr, e);
    };
  }
  $.ajax(rails_host + saveLink, {
         data: {data: JSON.stringify(data)},
         success: function(response, status, xhr) { success(response); },
         error: failure,
         type: "POST"});
}

function inlineExample(container, resources, args){
  container.css("display", "inline-block");
  args.mode = "inert";
  codeExample(container, resources, args);
}

function codeExample(container, resources, args) {
  var code = args.code;
  var codeContainer = jQuery("<div>");
  container.append(codeContainer);
  var cm = makeEditor(codeContainer, {
      cmOptions: {
        readOnly: 'nocursor'
      },
      initial: code,
      run: function() {}
   });

  ASSIGNMENT_PIECES.push({id: resources, editor: cm, mode: args.mode});

  return { container: container, activityData: {editor: cm} };
}

function codeAssignment(container, resources, args) {
  var tabs = createTabPanel(container);
  var editorContainer = drawEditorContainer();
  tabs.addTab("Code", editorContainer, { cannotClose: true });

  var defaultParts = {};
  args.parts.forEach(function(n) {
    defaultParts[n] = "\n";
  });

  var defaultActivityState = {
    status: {
      step: resources.steps[0].name,
      reviewing: false
    },
    parts: defaultParts
  };

  function setupAssignment(activityState) {
    ct_log("as: ", activityState);
    var currentState = activityState.status;
    var names = args.parts;
    var steps = [];
    resources.steps.forEach(function(elt) {
      steps.push(elt.name);
    });
    var sharedOptions = {
      run: function() {},
      names: names,
      steps: steps,
      afterHandlers: {}
    };

    function getContents() {
      var parts = {};
      args.parts.forEach(function(p) {
        parts[p] = editor.getAt(p);
      });
      return parts;
    }

    function afterReview(step, resumeCoding) {
      var toSaveAfterReview = {};
      toSaveAfterReview.parts = getContents();
      var indexOfStep = _.indexOf(steps, step);
      var status;
      editor.enableAll();
      if (indexOfStep === (resources.steps.length - 1)) {
        status = { done: true, step: step.name };
      }
      else {
        status = {
          reviewing: false,
          step: resources.steps[indexOfStep + 1].name
        };
      }
      toSaveAfterReview.status = status;
      saveResource(resources.path, toSaveAfterReview, resumeCoding);
    }

    function wrapStepForReview(step) {
      return {
        getReviewData: function(f, e) {
          function wrapResult(reviewData) {
            f(reviewData.map(function(rd) {
                return {
                  saveReview: function(val, success, failure) {
                    saveResource(
                        rd.save_review,
                        _.extend(val, { resource: rd.resource }),
                        success,
                        failure
                    );
                  },
                  getReview: function(present, absent) {
                    lookupResource(rd.save_review, present, absent);
                  },
                  attachWorkToReview: function(editorContainer, f, e) {
                    function wrapReviewContent(_content) {
                      var content = JSON.parse(_content.file);
                      readOnlyEditorFromParts(editorContainer, content.parts);
                      f();
                    }
                    ct_log(rd);
                    lookupResource(rd.resource, wrapReviewContent, e);
                  }
                }
              }))
          }
          lookupResource(step.do_reviews, wrapResult, e);
        }
      };
    }

    function readOnlyEditorFromParts(container, parts) {
      ct_log("Parts: ", parts);
      var cm = makeEditor(
        container,
        {
          initial: "",
          run: function() {}
        }
      );
      var thisEditorOptions = merge(sharedOptions, {
        initial: parts
      });
      var editor = createEditor(cm, args.codeDelimiters, thisEditorOptions);
      editor.disableAll();
    }

    var editorOptions = merge(sharedOptions, {
        initial: activityState.parts,
        drawPartGutter: function(stepName, insert) {
          var toRead = _.findWhere(resources.steps, { name: stepName }).read_reviews;
          lookupResource(toRead, function(reviews) {
            if (reviews.length !== 0) {
              var elt = drawReviewsButton(reviews.length);
              elt.on("click", function() {
                var reviewsDiv = drawReviewsDiv(args.name, stepName);
                reviews.forEach(function(r) {
                  lookupResource(r.resource, function(_data) {
                    var reviewContainer = drawReviewContainer();
                    reviewsDiv.append(reviewContainer);
                    var data = JSON.parse(_data.file);
                    readOnlyEditorFromParts(reviewContainer, data.parts);
                    reviewContainer.append(drawReview(r));
                  });
                });
                window.PANEL.addTab("Rev: " + args.name + ":" + stepName, reviewsDiv);
                return false;
              });
              insert(elt[0]);
            }
          }, function(/* not found */) {

          });
        }
      });

    resources.steps.forEach(function(step) {
      editorOptions.afterHandlers[step.name] = function(editor, resume) {
        ct_log("after ", step.name);
        var toSave = {};
        toSave.parts = getContents();
        toSave.status = { step: step.name, reviewing: true };

        saveResource(resources.path, toSave, function() {
            editor.disableAll();
            function afterSubmit() {
              reviewTabs(tabs, wrapStepForReview(step), function() { afterReview(step.name, resume); });
            }
            submitResource(resources.path, step.name, afterSubmit);
          }, function() {
            ct_error("Shouldn't fail to save work: ", resources.path, toSave);
          });
      }
    });

    var editor = steppedEditor(
        editorContainer,
        args.codeDelimiters,
        editorOptions
      );

    if (currentState.reviewing) {
      editor.disableAll();
      reviewTabs(
          tabs,
          wrapStepForReview(_.findWhere(resources.steps, { name: currentState.step })),
          function() {
            afterReview(
              currentState.step,
              function() { editor.advanceFrom(currentState.step); });
          }
      );
    }
    else {
      editor.resumeAt(currentState.step);
    }
  }

  lookupResource(
      resources.path,
      function(state) { setupAssignment(JSON.parse(state.file)); },
      function() { setupAssignment(defaultActivityState); }
  );

  return {
    container: container,
    activityData: {}
  };
}

function functionBuilder(container, resources, args) {

  var header = args.header;
  var check = args.check;
  var blobId = resources.blob;
  var pathId = resources.path;

  var codeContainer = jQuery("<div>");
  container.append(codeContainer);
  codeContainer.css("position", "relative");

  var gradeMode = typeof resources.reviews !== 'undefined';

  var cm = makeEditor(codeContainer,
                      { initial: "",
                        cmOptions: { readOnly: gradeMode, lineNumbers: true },
                        run: function(src, uiOpts, replOpts) {
                          var prelude = getPreludeFor(pathId);
                          RUN_CODE(prelude + src, uiOpts, replOpts);
                        }});

  var doc = cm.getDoc();

  ASSIGNMENT_PIECES.push({id: pathId, editor: cm, mode: args.mode});

  var editor = createEditor(cm, [
      header,
      "\ncheck:",
      "\nend"
    ], {
      names: ["definition", "checks"],
      initial: {definition: "\n", checks: "\n"}
    });

  var button = $("<button>Save and Submit</button>")
    .addClass("submit");

  if (gradeMode) {
    button.hide();
  }

  function handleResponse(data, version) {
    console.log("handling: ", data);

    editor.setAt("definition", data.body);
    editor.setAt("checks", data.userChecks);
  }

  function getWork() {
    var defn = editor.getAt("definition");
    var userChecks = editor.getAt("checks");
    return {body: defn, userChecks: userChecks};
  }

  function saveWork() {
    // TODO(joe): Some gif for pending save goes here
    versionsUI.onStartSave();
    saveResource(blobId, getWork(), function () {
      setTimeout(function () {
        versionsUI.onFinishSave();
      }, 1000);
    }, function (xhr, response) {
      ct_error("Saving failed.");
    });
  }

  var versionsUI = versions(codeContainer, {
    panel: window.PANEL,
    name: "Function Definition",
    lookupVersions: function(success, error) {
      lookupVersions(pathId, function(versions) {
        success(versions.map(function(v) {
          return {
            lookup: function(success2, error2) {
              lookupResource(v.resource, success2, error2, error2);
            },
            time: v.time,
            reviews: v.reviews.map(function(r) {
              return {
                lookup: function(success2) {
                  lookupReview(r.lookup, success2);
                }
              };
            }),
            original: v
          };
        }));
      });
    },
    save: function(success, error) {
      saveResource(pathId, getWork(), success, error);
    },
    onLoadVersion: function(response) {
      handleResponse(JSON.parse(response.file));
    }
  });

  cm.on("change", versionsUI.onChange);

  button.click(function () {
    versionsUI.saveVersion();

    var prelude = getPreludeFor(pathId);
    var work = getWork();
    var defn = work.body;
    var prgm = prelude + "\n" + header + "\n" + defn + "\ncheck:\n" + check + "\nend";
    RUN_CODE(prgm, {
        write: function(str) { /* Intentional no-op */ }
      },
      {check: true});
  });
  container.append(button);

  // NOTE(dbp): We look up the blob first, as that is the "current" version of the file,
  // if it exists; if it doesn't exist, we look up the path-ref resource.

  lookupResource(blobId, handleResponse, function () {
    lookupResource(pathId,
                   function (response) {
                     handleResponse(JSON.parse(response.file))
                   },
                   function() { });
  });

  // NOTE(dbp): We autosave to the blob. Clicking on "Save and Submit" creates a new
  // version. Switching to an old version makes a new version with the current blob version,
  // and replaces the blob with the old version.
  setInterval(function () {
    if (AUTOSAVE_ENABLED) {
      saveWork
    }
  }, 30000);


  var reviews = resources.reviews;
  if (gradeMode) {
    writeReviews(container, {
      hasReviews: Number(reviews.path.versions.length) > 0,
      reviews: {
          save: function(review, success, failure) {
            saveReview(
              reviews.path.versions[0].save,
              review,
              success,
              failure
            );
          },
          lookup: function(success, failure) {
            lookupReview(
              reviews.path.versions[0].lookup,
              success,
              failure
            );
          }
        }
      });
  }

  return {container: container, activityData: {codemirror: cm}};
}

function multipleChoice(container, resources, args)  {
  var id = resources.blob;
  function optionId(option) {
    return args.id + option.name;
  }
  function colorify(data) {
    args.choices.forEach(function(option) {
      var optNode = container.find("#" + optionId(option));
      var labelNode = container.find("[for=" + optionId(option) + "]");
      if(data.selected === option.name) {
        optNode.prop('checked',true);
        if(option.type === "choice-incorrect") {
          labelNode.css("background-color", "red");
          optNode.css("background-color", "red");
        }
      }
      if(option.type === "choice-correct") {
        labelNode.css("background-color", "green");
        optNode.css("background-color", "green");
      }
      optNode.attr("disabled", true);
    });
  }
  function addElements() {
    var form = $("<form>");
    args.choices.forEach(function(option) {
      var optDiv = container.find("#" + option.name);
      var optNode = $("<input type='radio'>").
        attr('id', optionId(option)).
        attr('data-name', option.name).
        attr('name', args.id);
      var labelNode = $("<label>").attr("for", optionId(option));
      form.append(optNode).append(labelNode).append($("<br>"));
      labelNode.append(optDiv.contents());
    });
    container.append(form);
  }
  lookupResource(id,
    function(response) {
      addElements();
      colorify(response);
    },
    function() {
      addElements();
      var button = $("<button>Submit</button>");
      button.attr("disabled", true);
      container.find("input[type=radio]").click(function() {
        button.attr("disabled", false);
      });
      button.click(function() {
        // NOTE(joe): Early return to simulate real mouse clicks on
        // disabled buttons when clicks sent programatically
        if (button.attr("disabled") === "disabled") return false;
        var selected = container.find(":checked").attr("data-name");
        var data = {"selected": selected};
        saveResource(id, data, function() {
            button.hide();
            colorify(data);
          },
          function(xhr, error) {
            ct_error("Save failed: ", xhr, error);
          });
        return false;
      });
      container.append(button);
    },
    function(xhr, error) {
      ct_error(error);
    });
  return {container: container};
}

var builders = {
  "inline-example": inlineExample,
  "code-example": codeExample,
  "function": functionBuilder,
  "code-assignment": codeAssignment,
  "multiple-choice": multipleChoice,
  "code-library": function(container, id, args) {
    ASSIGNMENT_PIECES.push({id: id, code: args.code, mode: args.mode});
    return $("<div>");
  }
};


// ct_transform looks for elements with data-ct-node=1,
// and then looks up their data-type in the builders hash,
// extracts args and passes the unique id, the args, and the node
// itself to the builder. The builder does whatever it needs to do,
// and eventually should replace the node with content.
function ct_transform(dom) {
  dom.find("[data-ct-node=1]").each(function (_, node) {
    var jnode = $(node);
    var args = JSON.parse(jnode.attr("data-args"));
    var type = jnode.attr("data-type");
    var resources;
    if (jnode.attr("data-resources")) {
      resources = JSON.parse(jnode.attr("data-resources"));
    }
    if (jnode.attr("data-parts")) {
      resources.steps = JSON.parse(jnode.attr("data-parts"));
    }
    function clean(node) {
      node
        .removeAttr("data-resources")
        .removeAttr("data-type")
        .removeAttr("data-args")
        .removeAttr("data-parts")
        .removeAttr("data-ct-node");
    }
    if (builders.hasOwnProperty(type)) {
      clean(jnode);
      var rv = builders[type](jnode, resources, args);
    } else {
      ct_error("Unknown builder type: ", type);
    }
  });
}

