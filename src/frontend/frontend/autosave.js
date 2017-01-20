angular.module('frontend-app').controller("AutosaveController", ['$rootScope', '$scope', AutosaveController]);

function AutosaveController($rootScope, $scope) {
    $scope.test = "hello";
    $scope.state = {
    	visiable: true,
    	currentFile: "Jan 10 3:31pm",
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
	var h = editor.css("height");
	var w = editor.css("width");
	$("#autosave-container").show().css({
		height: h,
		width: w
	});
}


function hideAutosave() {
	$("#autosave-container").hide();
}

function mostRecentFile() {
	return "";
}

function File(name) {
	return {
		name: name
	};
}