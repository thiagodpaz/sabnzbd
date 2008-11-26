var refreshRate = 30; // default refresh rate
var skipRefresh = false;
var focusedOnSpeedChanger = false;
var queue_view_preference = 15;
var history_view_preference = 15;

// once the DOM is ready, run this
$(document).ready(function(){
	
	// activate main menu (shown upon hovering SABnzbd logo)
	$(".nav").superfish({
		animation	: { opacity:"show", height:"show" },
		hoverClass	: "sfHover",
		delay		: 800,
		animation	: {opacity:"show"},
		speed		: "normal",
		autoArrows	: false
	});
	
	// this code will remain instantiated even when the contents of the queue change
	$('#queueTable').livequery(function() {
		
		$('#queue_view_preference').change(function(){
			$.cookie('queue_view_preference', $('#queue_view_preference').val(), { expires: 365 });
			RefreshTheQueue();
		});
		
		// queue sorting
		InitiateQueueDragAndDrop();
		
		$('#queueTable .title').dblclick(function(){
			$(this).parent().parent().prependTo('#queueTable');
			$.ajax({
				type: "GET",
				url: "queue/switch?uid1="+$(this).parent().parent().attr('id')+"&uid2=0&_dc="+Math.random()
			});
		});
		
		// processing option changes
		$('#queueTable .proc_category').change(function(){
			$.ajax({
				type: "GET",
				url: 'queue/change_cat?_dc='+Math.random()+'&nzo_id='+$(this).parent().parent().attr('id')+'&cat='+$(this).val()
			});
		});
		$('#queueTable .proc_option').change(function(){
			$.ajax({
				type: "GET",
				url: 'queue/change_opts?_dc='+Math.random()+'&nzo_id='+$(this).parent().parent().attr('id')+'&pp='+$(this).val()
			});
		});
		$('#queueTable .proc_script').change(function(){
			$.ajax({
				type: "GET",
				url: 'queue/change_script?_dc='+Math.random()+'&nzo_id='+$(this).parent().parent().attr('id')+'&script='+$(this).val()
			});
		});
		
		// skip queue refresh on mouseover
		$('#queueTable').bind("mouseover", function(){ skipRefresh=true; });
		$('#queueTable').bind("mouseout", function(){ skipRefresh=false; });
		$('.box_fatbottom').bind("mouseover mouseout", function(){ skipRefresh=false; });
		
	});
	
	// this code will remain instantiated even when the contents of the history change
	$('#history .left_stats').livequery(function() {
		// history view limiter
		$('#history_view_preference').change(function(){
			$.cookie('history_view_preference', $('#history_view_preference').val(), { expires: 365 });
			RefreshTheHistory();
		});
	});
	
	// this code will remain instantiated even when the contents of the history change
	$('#history .last div').livequery(function() {
		// tooltips for verbose notices
		$(this).tooltip({
			extraClass:	"tooltip",
			track:		true, 
			fixPNG:		true
		});
	});
	
	// additional tooltips
	$('.tip').tooltip({
		extraClass:	"tooltip",
		track:		true, 
		fixPNG:		true
	});
	
	
	// restore Refresh rate from cookie
	if ($.cookie('Plush2Refresh'))
		refreshRate = $.cookie('Plush2Refresh');
	else
		$.cookie('Plush2Refresh', refreshRate, { expires: 365 });
	
	// restore queue/history view preferences
	if ($.cookie('queue_view_preference'))
		queue_view_preference = $.cookie('queue_view_preference');
	if ($.cookie('history_view_preference'))
		history_view_preference = $.cookie('history_view_preference');

	// Refresh Rate main menu input
	$("#refreshRate-option").val(refreshRate);
	$("#refreshRate-option").change( function() {
		reactivate = false;
		if (refreshRate == 0)
			reactivate = true;
		refreshRate = $("#refreshRate-option").val();
		$.cookie('Plush2Refresh', refreshRate, { expires: 365 });
		if (refreshRate > 0 && reactivate)
			MainLoop();
	});
	
	// Max Speed main menu input
	$("#maxSpeed-option").focus( function() {
		focusedOnSpeedChanger = true;
	});
	$("#maxSpeed-option").blur( function() {
		focusedOnSpeedChanger = false;
	});
	$("#maxSpeed-option").change( function() {
		$.ajax({
			type: "GET",
			url: "api?mode=config&name=set_speedlimit&value="+$("#maxSpeed-option").val()+"&_dc="+Math.random()
		});
	});
	
	// On Queue Finish main menu select
	$("#onQueueFinish-option").change( function() {
		$.ajax({
			type: "GET",
			url: "queue/change_queue_complete_action?action="+$("#onQueueFinish-option").val()+"&_dc="+Math.random()
		});
	});
	
	// Sort Queue main menu options
	$('#sort_by_avg_age').click(function(event) {
		$.ajax({
			type: "GET",
			url: "queue/sort_by_avg_age?_dc="+Math.random(),
			success: function(result){
				return RefreshTheQueue();
			}
		});
	});
	$('#sort_by_name').click(function(event) {
		$.ajax({
			type: "GET",
			url: "queue/sort_by_name?_dc="+Math.random(),
			success: function(result){
				return RefreshTheQueue();
			}
		});
	});
	$('#sort_by_size').click(function(event) {
		$.ajax({
			type: "GET",
			url: "queue/sort_by_size?_dc="+Math.random(),
			success: function(result){
				return RefreshTheQueue();
			}
		});
	});
	
	// purge queue
	$('#queue_purge').click(function(event) {
		if(confirm('Sure you want to clear out your Queue?')){
			$.ajax({
				type: "GET",
				url: "queue/purge?_dc="+Math.random(),
				success: function(result){
					return RefreshTheQueue();
				}
			});
		}
	});
	
	// Set up +NZB by URL/Newzbin Report ID
	$('#addID').bind('click', function() { 
		$.ajax({
			type: "GET",
			url: "addID",
			data: "id="+$("#addID_input").val()+"&pp="+$("#addID_pp").val()+"&script="+$("#addID_script").val()+"&cat="+$("#addID_cat").val(),
			success: function(result){
				return RefreshTheQueue();
			}
		});
		$("#addID_input").val('enter NZB URL / Newzbin ID');
	});
	$('#addID_input').val('enter NZB URL / Newzbin ID').focus( function(){
		if ($(this).val()=="enter NZB URL / Newzbin ID")
			$(this).val('');
	}).blur( function(){
		if (!$(this).val())
			$(this).val('enter NZB URL / Newzbin ID');
	});
	
	// set up +NZB by file upload
	$('#uploadNZBForm').submit( function(){
		return AIM.submit(this, {'onComplete': RefreshTheQueue})
	});

	$('#addNZBbyFile').upload({
	        name: 'name',
	        action: 'api',
	        enctype: 'multipart/form-data',
	        params: {mode: "addfile", pp: $("#addID_pp").val(), script: $("#addID_script").val(), cat: $("#addID_cat").val()},
	        autoSubmit: true,
	        onComplete: RefreshTheQueue
			//onSubmit: function() {},
	        //onSelect: function() {}
	});
	
	
	// toggle queue shutdown - from options menu
	if ($('#queue_shutdown_option')) {
		$('#queue_shutdown_option').bind('click', function() { 
			if(confirm('Are you sure you want to shut down your *computer* when the downloads have finished?')){
				$.ajax({
					type: "GET",
					url: "queue/tog_shutdown?_dc="+Math.random(),
					success: function(result){
						return RefreshTheQueue();
					}
				});
			}
		});
	}
	
	// set up "shutdown sabnzbd" from main menu
	$('#shutdown_sabnzbd').click( function(){
		if(confirm('Sure you want to shut down the SABnzbd application?'))
			window.location='shutdown';
	});
	
	// pause / resume
	$('#pause_resume').click(function(event) {
		if ($(event.target).attr('class') == 'tip q_menu_pause q_menu_paused')
			$.ajax({
				type: "GET",
				url: "api?mode=resume&_dc="+Math.random()
			});
		else
			$.ajax({
				type: "GET",
				url: "api?mode=pause&_dc="+Math.random()
			});
		if ($('#pause_resume').attr('class') == 'tip q_menu_pause q_menu_paused')
			$('#pause_resume').attr('class','tip q_menu_pause q_menu_unpaused');
		else
			$('#pause_resume').attr('class','tip q_menu_pause q_menu_paused');
	});
	
	// Set up Queue Menu actions
	$('#queue').click(function(event) {
		if ($(event.target).is('.queue_delete') && confirm('Delete NZB? Are you sure?') ) {
			delid = $(event.target).parent().parent().attr('id');
			$('#'+delid).fadeOut('fast');
			$.ajax({
				type: "GET",
				url: 'queue/delete?_dc='+Math.random()+'&uid='+delid
			});
		}
	});
	
	// history verbosity
	$('.h_menu_verbose').click(function(event) {
		$.ajax({
			type: "GET",
			url: 'history/tog_verbose?_dc='+Math.random(),
			success: function(result){
				return RefreshTheHistory();
			}
		});
	});
	
	// history purge
	$('.h_menu_purge').dblclick(function(event) {
		$.ajax({
			type: "GET",
			url: 'history/purge?_dc='+Math.random(),
			success: function(result){
				return $('#history').html(result);
			}
		});
	});
	
	// Set up History Menu actions
	$('#history').click(function(event) {
		if ($(event.target).is('.queue_delete')) {	// history delete
			delid = $(event.target).parent().parent().attr('id');
			$('#'+delid).fadeOut('fast');
			$.ajax({
				type: "GET",
				url: 'history/delete?_dc='+Math.random()+'&job='+delid
			});
		}
	});
	
	// fix IE6 .png image transparencies
	$('img[@src$=.png], div.history_logo, a.queue_logo, li.q_menu_addnzb, li.q_menu_pause, li.h_menu_verbose, li.h_menu_purge, div#time-left, div#speed').ifixpng();

	// initiate refresh cycle
	MainLoop();
	
});

// calls itself after `refreshRate` seconds
function MainLoop() {
	
	// ajax calls
	RefreshTheQueue();
	RefreshTheHistory();
	
	// loop
	if (refreshRate > 0)
		setTimeout("MainLoop()",refreshRate*1000);
}

// in a function since some processes need to refresh the queue outside of MainLoop()
function RefreshTheQueue() {
	if (skipRefresh) return $('#skipped_refresh').fadeIn("slow").fadeOut("slow"); // set within queue <table>
	var limit = queue_view_preference;
	if ($('#queue_view_preference').val() != "")
		var limit = $('#queue_view_preference').val()
	$.ajax({
		type: "GET",
		url: 'queue/?dummy2='+limit+'&_dc='+Math.random(),
		success: function(result){
			return $('#queue').html(result);
		}
	});
}

// in a function since some processes need to refresh the queue outside of MainLoop()
function RefreshTheHistory() {
	var limit = history_view_preference;
	if ($('#history_view_preference').val() != "")
		var limit = $('#history_view_preference').val()
	$.ajax({
		type: "GET",
		url: 'history/?dummy2='+limit+'&_dc='+Math.random(),
		success: function(result){
			return $('#history').html(result);
		}
	});
}

// called upon every queue refresh
function InitiateQueueDragAndDrop() {
	$("#queueTable").tableDnD({
		onDrop: function(table, row) {
			var rows = table.tBodies[0].rows;
			
			if (rows.length < 2)
				return false;
			
			// determine which position the repositioned row is at now
			for ( var i=0; i < rows.length; i++ )
				if (rows[i].id == row.id)
					return $.ajax({
						type: "GET",
						url: "queue/switch?uid1="+row.id+"&uid2="+i+"&_dc="+Math.random()
					});
			return false;
		}
	});	
}

/*
// disables toggler text selection when clicking
function disableSelection(element) {
    element.onselectstart = function() {
        return false;
    };
    element.unselectable = "on";
    element.style.MozUserSelect = "none";
    element.style.cursor = "default";
};
*/
