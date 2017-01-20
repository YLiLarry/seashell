angular.module('frontend-app').controller("AutosaveController", ['$rootScope', '$scope', AutosaveController]);

function AutosaveController($rootScope, $scope) {
    $scope.test = "hello";
    $scope.state = {
    	visiable: true,
    	currentFile: File("Jan 10 3:31pm"),
    	files: [File("Jan 11 3:31pm"), File("Jan 10 3:31pm"), File("Jan 9 3:31pm"), File("Jan 9 3:30pm"), File("Jan 9 3:29pm"), File("Initial")]
    };
    $rootScope.$on('toggleAutosaveView', function(event, args) {
    	$scope.state.visiable = !$scope.state.visiable;
    	if ($scope.state.visiable) {
    		showAutosave($scope);
    	} else {
    		hideAutosave($scope);
    	}
    });
    $scope.showAutosave = showAutosave;
    $scope.hideAutosave = hideAutosave;
}


function showAutosave($scope) {
	var editor = $("#editor");
	// set height as the same as the editor
	$("#autosave").show().css({
		height: editor.css("height"),
		width: editor.css("width")
	});
	// set width of the file view
	var fileview = $("#autosave-file");
	var autosave = $("#autosave");
	var listview = $("#autosave-list");
	$("#autosave-file").css({
		width: autosave.width() - listview.width()
	});
}


function hideAutosave() {
	$("#autosave").hide();
}

function mostRecentFile() {
	return "";
}

function File(name) {
	return {
		name: name,
		contents: "text"
	};
}