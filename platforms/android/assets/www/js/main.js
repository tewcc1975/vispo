var app = {
	discoverSwiper: undefined,
    homeSwiper: undefined,
    storySwiper: undefined,
	swiperOptions: {
		// freeMode: true,
		// freeModeFluid: true,
		// cssWidthAndHeight: true,
		// calculateHeight: true,
		centeredSlides: true,
		// offsetPxBefore: 50,
		// initialSlide: 1,
		slidesPerView: 'auto'
	},
	swiperNestedOptions: {
		mode: 'vertical',
	    // freeMode: true,
		// freeModeFluid: true,
		// centeredSlides: true,
		// initialSlide: 1,
		// slidesPerView: 'auto'
		slidesPerView: 1
	},
	swiperDimensions: {
    	slideHeightOrin: 924,
		slideWidthOrin: 1478,
		slideWHRatio: 1478/924,
		scaleRatio: 0.8,		
		swiperHeightOrin: 837,
		slideHeightScaled: 924,
		slideWidthScaled: 1478,						
		slideHContainerHRatio: 739 / 837,
		setup: function() {
			this.slideWHRatio = this.slideWidthOrin / this.slideHeightOrin;
			this.slideHeightScaled = this.slideHeightOrin * this.scaleRatio;
			this.slideWidthScaled = this.slideWidthOrin * this.scaleRatio;					
			this.slideHContainerHRatio = this.slideHeightScaled / this.swiperHeightOrin;
		}
    },
	onStorySlideChangeStart: function(swiper) {
		var actionsPanel = $('#storypage #actions-form'),
			activeSlide = swiper.activeSlide(),
			currStory = app.currStory,
			pageId = $(activeSlide).data('storyid'),
			parent = $(activeSlide).data('parent');
		if ($(activeSlide).hasClass('slide-nested')) {
			pageId = $(activeSlide).find('.swiper-slide-active').data('storyid');
		}
		currStory.fetch({pageId: pageId}, function() {
			actionsPanel.find('#editPage').attr('href', 'storyedit.html?mode=update&pageid=' + pageId);
    		actionsPanel.find('#addNewPage').attr('href', 'storyedit.html?mode=insert&coverid=' + currStory.coverId);    	
    		actionsPanel.find('#addBelowFold').attr(
    			'href', 
    			'storyedit.html?mode=insert&coverid=' + currStory.coverId +	'&parent=' + (parent != 0 ? parent : pageId)
    		);	
		});	    
	},
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    db: undefined,
    dbresults: undefined,
    currCoverIdx: 0,
    story: [],
    storyBak: {},
    currStory: {
    	coverId: 0, 
    	pageId: 0,  
    	title: '',   
    	subtitle: '',
    	content: '', 
    	parent: 0,   
    	level: 0,    
    	pageorder: 0,
    	inspired: 0, 
    	comments: 0,
    	status: {
    		maxCoverId: 0,
	    	maxPageId: 0,
	    	maxPageorder: 0,	
    	},
    	statusCurrStory: {
	    	maxPageId: 0,
	    	maxPageorder: 0,
    	},
    	statusBelowFold: {
	    	maxPageId: 0,
	    	maxPageorder: 0,
    	},
    	reset: function(input) {
	    	var me = this;
	    	me.coverId = 0,
	    	me.pageId = 0,
	    	me.title = '', 
	    	me.subtitle = '', 
	    	me.content = '',
	    	me.parent = 0,
	    	me.level = 0, 
	    	me.pageorder = 0, 
	    	me.inspired = 0, 
	    	me.comments = 0;
	    	me.modify(input);		    
	    },
	    modify: function(input) {
	    	if (input) {
		    	for (var prop in input) {
		    		if (this.hasOwnProperty(prop)) {		    			
		    			this[prop] = input[prop];
		    		}
		    	}
		    }
	    },
	    updateStory: function(callback) {
	    	var me = this;
	    	app.db.transaction(function(tx) {						
				tx.executeSql(
					'UPDATE story_cover SET title = ?, subtitle = ? WHERE id = ?', 
					[me.title, me.subtitle, me.coverId], 
					function(tx, result) {
						tx.executeSql(
							'UPDATE story_page SET content = ?, pageorder = ? WHERE id = ?', 
							[me.content, me.pageorder, me.pageId],
							function(tx, result) {
								app.saveStorySuccess = true;
								if (callback) {
									callback();
								}
							},
							app.onStoryPageError
						);
					},
					app.onStoryError
				);
			});
	    },
	    updateStatus: function(callback) {
	    	var me = this;
	    	app.db.readTransaction(function(tx) {	    		
	    		tx.executeSql(
	    			'SELECT max(id) AS maxPageId, max(cover_id) AS maxCoverId, max(pageorder) AS maxPageorder FROM story_page',
					[],
					function(tx, result) {
						var status = me.status,
							row;
						if (result.rows.length == 0) {
							status.maxPageId = 0;
							status.maxCoverId = 0;
							status.maxPageorder = 0;
						}
						else {
							row = result.rows.item(0);
							status.maxPageId = row.maxPageId;
							status.maxCoverId = row.maxCoverId;
							status.maxPageorder = row.maxPageorder;
						}
						if (callback) {
							callback();
						}
					},
					function(tx, error) {
						console.log(error.message);
					}
	    		);
	    	});
	    },
	    updateStatusCurrStory: function(callback) {
	    	var me = this;
	    	app.db.readTransaction(function(tx) {	    		
	    		tx.executeSql(
	    			'SELECT max(id) AS maxPageId, max(pageorder) AS maxPageorder FROM story_page WHERE cover_id = ?',
					[me.coverId],
					function(tx, result) {
						var status = me.statusCurrStory,
							row;
						if (result.rows.length == 0) {
							status.maxPageId = 0;
							status.maxPageorder = 0;
						}
						else {
							row = result.rows.item(0);
							status.maxPageId = row.maxPageId;
							status.maxPageorder = row.maxPageorder;	
						}						
						if (callback) {
							callback.apply(me);
						}
					},
					function(tx, error) {
						console.log(error.message);
					}
	    		);
	    	});
	    },
	    updateStatusBelowFold: function(callback) {
	    	var me = this;
	    	app.db.readTransaction(function(tx) {	    		
	    		tx.executeSql(
	    			'SELECT max(id) AS maxPageId, max(pageorder) AS maxPageorder FROM story_page WHERE parent = ?',
					[me.parent],
					function(tx, result) {
						var status = me.statusBelowFold,
							row;
						if (result.rows.length == 0) {
							status.maxPageId = 0;
							status.maxPageorder = 0;
						}
						else {
							row = result.rows.item(0);
							status.maxPageId = row.maxPageId;
							status.maxPageorder = row.maxPageorder;	
						}
						if (callback) {
							callback.apply(me);
						}
					},
					function(tx, error) {
						console.log(error.message);
					}
	    		);
	    	});
	    },
	    insertStory: function(callback) {
	    	var me = this;
	    	app.db.transaction(function(tx) {
				if (me.level == 1) {
					if (me.coverId == 0) {
						me.pageorder = me.statusCurrStory.maxPageorder + 1;			
						tx.executeSql(
							'INSERT INTO story_cover (title, subtitle, inspired, comments) VALUES (?, ?, ?, ?)', 
							[me.title, me.subtitle, me.inspired, me.comments], 
							function(tx, result) {
								me.coverId = result.insertId;								
								tx.executeSql(
									'INSERT INTO story_page (cover_id, content, parent, level, pageorder) VALUES (?, ?, ?, ?, ?)', 
									[me.coverId, me.content, 0, me.level, me.pageorder],
									function(tx, result) {
										me.pageId = result.insertId;										 
										app.saveStorySuccess = true;
										if (callback) {
											callback();
										}	
									},
									app.onStoryPageError
								);
							},
							app.onStoryError
						);			
					}
					else {
						me.pageorder = me.statusCurrStory.maxPageorder + 1;
						tx.executeSql(
							'INSERT INTO story_page (cover_id, content, parent, level, pageorder) VALUES (?, ?, ?, ?, ?)', 
							[me.coverId, me.content, 0, me.level, me.pageorder],
							function(tx, result) {
								console.log('Insert new page successfully!');
								me.pageId = result.insertId;
								app.saveStorySuccess = true;
								if (callback) {
									callback();
								}	
							},
							app.onStoryPageError
						);
					}
				}
				else if (me.level == 2) {
					me.pageorder = me.statusBelowFold.maxPageorder + 1;
					tx.executeSql(
						'INSERT INTO story_page (cover_id, content,parent, level, pageorder) VALUES (?, ?, ?, ?, ?)', 
						[me.coverId, me.content, me.parent, me.level, me.pageorder],
						function(tx, result) {
							me.pageId = result.insertId;
							app.saveStorySuccess = true;
							app.onBelowFoldSuccess;
							if (callback) {
								callback();
							}	
						},
						app.onStoryPageError
					);
				}
			});
	    },
	    fetch: function(params, callback) {
	    	var queryString = '',
	    		queryValue = [],
	    		me = this;
	    	for (var prop in params) {
	    		queryValue.push(params[prop]);
	    		if (queryString.length == 0) {
	    			queryString += prop + '= ? ';	
	    		}
	    		else {
	    			queryString += 'AND ' + prop + '= ? ';
	    		}	    		
	    	}
	    	app.db.readTransaction(function(tx) {	    		
	    		tx.executeSql(
	    			'SELECT title, subtitle, inspired, comments, sp.id AS pageId, cover_id AS coverId, content, parent, level, pageorder ' + 
					'FROM story_page sp JOIN story_cover sc ON sp.cover_id = sc.id WHERE ' + queryString,
					queryValue,
					function(tx, result) {
						var row = result.rows.item(0);
						me.reset(row);
						if (callback) {
							callback();
						}
					},
					function(tx, error) {
						console.log(error.message);
					}
	    		);
	    	});
	    }	    
    },    
    saveStorySuccess: false,
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
    	$(document).on('pagecontainerchange', this.onPageContainerChange);
    	$(document).on('pagecontainerload', function(evt, data) {
    		if (data.toPage.is('#discoverpage, #storypage')) {
    			// app.changeSwiperLayout();
    		}
    	});
    	$('#discoverpage').on('pagecreate', function(evt) {
    		$('ul.story-categories li a').on('tap', function() {
				$('#discoverpage [data-role=header] h1').text('Vispo - Category: ' + $(this).text());
				$("#search-story").panel( "toggle" );
			});
			$('.story-tags a').on('tap', function() {
				$('#discoverpage [data-role=header] h1').text('Vispo - Tag: ' + $(this).text());
				$("#search-story").panel( "toggle" );
			});
			$('.all-stories').on('tap', function() {
				$('#discoverpage [data-role=header] h1').text('Vispo');
				$("#search-story").panel( "toggle" );
			});
			/*$('.add-story').on('tap', function(evt) {
				if (navigator.camera) {
					navigator.camera.getPicture(
						function(imageURI) {	    						
							$('.story-image').attr('src', imageURI);
						},
						function(message) {
							navigator.notification.alert('get picture failed', function() {});
						},
						{
							quality: 50, 
							destinationType: Camera.DestinationType.FILE_URI,
							sourceType: Camera.PictureSourceType.PHOTOLIBRARY
						}
			        );
				}    				
			});*/
    	});    	
        this.onDeviceReady();
        // document.addEventListener('deviceready', this.onDeviceReady, false);
        // $(document).on('orientationchange', function() {
        	// this.mySwiper.reInit();
        // });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function(evt) {
    	app.swiperDimensions.setup();   	
    	app.db = window.openDatabase('storieshouse', '1.0', 'Stories House', 200000);
		app.db.transaction(reinitStories, app.onTransError, app.onTransSuccess);
		// app.db.transaction(getDbStories, onTransError, onTransSuccess);
		$('#slidePopupMenu').enhanceWithin().popup();
		
		function reinitStories(tx) {
			/*tx.executeSql('DROP TABLE IF EXISTS story_cover');
			tx.executeSql('DROP TABLE IF EXISTS story_page');*/
			tx.executeSql('CREATE TABLE IF NOT EXISTS story_cover (id INTEGER PRIMARY KEY, title, subtitle, inspired INTEGER, comments INTEGER)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS story_page (id INTEGER PRIMARY KEY, cover_id INTEGER, content, parent INTEGER, level INTEGER, pageorder INTEGER)');			
			/*tx.executeSql('DELETE FROM story_cover');
			tx.executeSql('DELETE FROM story_page');
			tx.executeSql('INSERT INTO story_cover (title, subtitle, inspired, comments) VALUES (?, ?, ?, ?)', [
		      	'DB Story 1',
		      	'DB Story 1 subtitle',
		      	0, 0
		    ], app.onExecuteSuccess, app.onExecuteError);
			tx.executeSql('INSERT INTO story_page (cover_id, content, parent, level, pageorder) VALUES (?, ?, ?, ?, ?)', [
		      	1,
		      	'<h2>DB Story 1</h2><p>Story 1 from local storage</p>',
		      	0, 1, 1
		    ], app.onExecuteSuccess, app.onExecuteError);
		    tx.executeSql('INSERT INTO story_cover (title, subtitle, inspired, comments) VALUES (?, ?, ?, ?)', [
		      	'DB Story 2',
		      	'DB Story 2 subtitle',
		      	0, 0
		    ], app.onExecuteSuccess, app.onExecuteError);
		    tx.executeSql('INSERT INTO story_page (cover_id, content, parent, level, pageorder) VALUES (?, ?, ?, ?, ?)', [
		      	2,
		      	'<h2>DB Story 2</h2><p>Story 2 from local storage</p>',
		      	0, 1, 1
		    ], app.onExecuteSuccess, app.onExecuteError);*/
		}
    },
    getPicture: function(getPicSuccess, getPicError, options) {
    	if (!navigator.camera) {
			$('.story-image').attr('src', '../pics/coffee/Ascension-Coffee-Brewing.jpg');	
		}		
		if (navigator.camera) {
			/*getPicSuccess || (getPicSuccess = function(imageURI) {
				console.log('Get picture successfully');
				$('.story-image').attr('src', imageURI);
			});
			getPicError || (getPicError = function(message) {
				console.log('Get picture canceled or failed');
				$(':mobile-pagecontainer').pagecontainer('change', 'index.html');
			});*/
			options || (options = {
					quality: 50, 
					destinationType: Camera.DestinationType.FILE_URI,
					sourceType: Camera.PictureSourceType.PHOTOLIBRARY
			});
			navigator.camera.getPicture(
				function(imageURI) {
					console.log('Get picture successfully');
					if (getPicSuccess)
						getPicSuccess(imageURI);
				},
				function(message) {
					console.log('Get picture canceled or failed');
					if (getPicError) 
						getPicError(message);
				},
				options
	        );
		}		
    },    
    getDbStories: function(tx) {    				
		tx.executeSql(
			'SELECT sc.*, sp.id AS pageId, sp.content FROM story_cover sc JOIN story_page sp ON sc.id = sp.cover_id WHERE sp.pageorder = 1 AND sp.parent = 0', 
			[], 
			app.onSelectStoriesSuccess, 
			app.onExecuteError
		);
	},	
	getDbCurrStory: function(tx) {
		var currPage = $.mobile.path.parseLocation(),
	    	params = app.parseQueryString(currPage.search),
	    	story = app.story;	    	 				
		tx.executeSql(
			'SELECT sc.*, sp.id AS pageId, cover_id AS coverId, content, parent, level, pageorder, sp.content ' + 
			'FROM story_cover sc JOIN story_page sp ON sc.id = sp.cover_id WHERE cover_id = ? AND parent = 0', 
			[params.coverid], 
			function(tx, result) {
				var len = result.rows.length,
					storyLen = story.length,
					tmpMap = [],
					row;
				for (var j = 0; j < storyLen; j++) {
					story.pop();
				}
				for (var i = 0; i < len; i++)  {
					row = result.rows.item(i);
					story.push(row);
					tmpMap.push(row.pageId);
				}
				tx.executeSql(
					'SELECT sc.*, sp.id AS pageId, cover_id AS coverId, content, parent, level, pageorder, sp.content ' + 
					'FROM story_cover sc JOIN story_page sp ON sc.id = sp.cover_id WHERE cover_id = ? AND parent <> 0',
					[params.coverid],
					function(tx, result) {
						var len = result.rows.length;
						for (var i = 0; i < len; i++)  {
							row = result.rows.item(i);
							if (!story[tmpMap.indexOf(row.parent)].nested) {
								story[tmpMap.indexOf(row.parent)].nested = [];
							}
							story[tmpMap.indexOf(row.parent)].nested.push(row);
						}
						app.onSelectCurrStorySuccess();
					},
					app.onExecuteError
				);
			}, 
			app.onExecuteError
		);
	},	
	onTransSuccess: function() {
		console.log('Transaction successful');
	},	
	onTransError: function(error) {
		console.log('Transaction error ' + error.message);
	},
	onExecuteSuccess: function(tx, result) {
		console.log('Sql executed successful');
	},	
	onExecuteError: function(tx, error) {
		console.log('Sql execution error: ' + error.message);
	},	
	onSelectStoriesSuccess: function(tx, results) {
		app.dbresults = results;		
		var activeSwiper,
			swiperContainer = $('.swiper-container.swiper-parent>.swiper-wrapper'),
			len = results.rows.length,
			row,
			slide;
		swiperContainer.empty();
		/*if(app.discoverSwiper) {
			app.discoverSwiper.destroy();
			app.discoverSwiper = null;
		}*/	
		app.changeSwiperLayout();
		for (var i=0; i < len; i++) {
			row = results.rows.item(i);
			slide = $(				 
				'<div><div class="inner">' +
			    row.content +
			    '<div data-theme="b" data-role="footer" data-position="fixed" data-tap-toggle="false">' +
			    '<hgroup>' + 
			    '<h1>' + row.title + '</h1>' +
			    '<p>' + row.subtitle + '</p>' +
			    '</hgroup>' + 
			    '<a href="#" class="user-link">Coffee God</a>' +
	            '<a href="#" class="inspired-link">' + row.inspired + ' Inspired</a>' +
	            '<a href="#" class="comment-link">' + row.comments + ' Comments</a>' +
	            '<a href="#" class="social-link instagram">instagram</a>' +
	            '<a href="#" class="social-link gplus">gplus</a>' +
	            '<a href="#" class="social-link twitter">twitter</a>' +
	            '<a href="#" class="social-link fb">fb</a>' +
			    '</div>' +
			    '</div></div>'
			).addClass('swiper-slide slide-' + (i + 1));
			slide.data('storyid', row.pageId);				
			slide.data('coverid', row.id);
			slide.appendTo(swiperContainer);
			app.changeSlideDimension(slide);
			slide.on('tap', function(evt) {
				evt.stopPropagation();
				if ($(evt.target).is('[data-role=footer], [data-role=footer] *')) {					
					return;
				}
				$(':mobile-pagecontainer').pagecontainer('change', 'story.html?coverid=' + $(this).closest('.swiper-slide').data('coverid'));
			});
		}
		$('.swiper-slide').enhanceWithin();
		app.initSwiper('discoverSwiper', '#discoverpage .swiper-container.swiper-parent', app.swiperOptions);
		slide = $(app.discoverSwiper.activeSlide());
		if (!slide.hasClass(app.discoverSwiper.params.slideActiveClass))
			slide.addClass(app.discoverSwiper.params.slideActiveClass);
	},
	onSelectCurrStorySuccess: function() {
		var swiperContainer = $('.swiper-container.swiper-parent>.swiper-wrapper'),
			story = app.story,
			len = story.length,
			row, rowNested, lenNested,
			slide, slideNested, 
			slideIndexNested = 0,
			activeSwiper, storySwiperNested;
		if(app.storySwiper) {
			app.storySwiper.destroy();
			app.storySwiper = null;
		}
		app.swiperOptions.onSlideChangeStart = app.onStorySlideChangeStart;
		app.swiperNestedOptions.onSlideChangeStart = app.onStorySlideChangeStart;
		activeSwiper = app.storySwiper;
		swiperContainer.empty();		
		for (var i = 0; i < len; i++) {
			row = story[i];
			if (row.nested) {
				slide = $(
					'<div><div class="swiper-container swiper-child">' + 
					'<div class="swiper-wrapper"></div><div class="pagination pagination-' + (i + 1) +'"></div>' + 
					'</div></div>'
				).addClass('swiper-slide slide-nested slide-' + (i + 1));				 
				slide.data('storyid', row.pageId);				
				slide.data('coverid', row.id);
				slide.data('parent', row.parent);
				slide.appendTo(swiperContainer);
				app.changeSlideDimension(slide);
				slideIndexNested++;				
				lenNested = row.nested.unshift(row);
				for (var j = 0; j < lenNested; j++) {
					rowNested = row.nested[j];
					slideNested = $(
						'<div><div class="inner">' +
					    rowNested.content +
					    '</div>' +
					    '</div></div>'
					).addClass('swiper-slide slide-' + (i + 1) + '-' + (j + 1));
					slideNested.data('storyid', rowNested.pageId);				
					slideNested.data('coverid', rowNested.id);
					slideNested.data('parent', rowNested.parent);
					slideNested.appendTo(slide.find('.swiper-wrapper'));
					app.changeSlideDimension(slideNested);
				}
				if (!storySwiperNested) storySwiperNested = {}; 
				storySwiperNested['storySwiperNested_' + slideIndexNested] = slide;				
			}
			else {
				slide = $(
					'<div><div class="inner">' +
				    row.content +				    
				    (row.pageorder != 1 ? '' :
				    '<div data-theme="b" data-role="footer" data-position="fixed" data-tap-toggle="false">' + 
				    '<div class="ui-body">' +
				    '<h1>' + row.title + '</h1>' +
				    '<p>' + row.subtitle + '</p>' +
				    '</div>') +
				    '</div>' +
				    '</div></div>'
				).addClass('swiper-slide slide-' + (i + 1));
				slide.data('storyid', row.pageId);				
				slide.data('coverid', row.id);
				slide.data('parent', row.parent);
				slide.appendTo(swiperContainer);
				/*$('.swiper-slide.slide-' + (i + 1)).on('tap',function(evt) {
										
				});*/
				app.changeSlideDimension(slide);
			}
		}
		app.changeSwiperLayout();	
		$('.swiper-slide').enhanceWithin();
		app.storySwiper = $('#storypage .swiper-container.swiper-parent').swiper(app.swiperOptions);
		if (storySwiperNested) {
			app.storySwiper.nested = {};
			for (var item in storySwiperNested) {
				app.swiperNestedOptions.pagination = storySwiperNested[item].find('.pagination')[0];
				app.swiperNestedOptions.paginationClickable = true;
				app.storySwiper.nested[item] = storySwiperNested[item].find('.swiper-container').swiper(app.swiperNestedOptions); 
			}
		}
		$('#storypage [data-role=header] h1').text('Story - ' + row.title + ':' + row.subtitle);
		$('#storypage [data-role=footer] a.inspired-link').text(row.inspired + ' inspired');
		$('#storypage [data-role=footer] a.comment-link').text(row.comments + ' comments');
		if (app.currStory.pageId != 0) {
    		app.storyGetFocus();
    	}
		app.onStorySlideChangeStart(app.storySwiper);
	},   
    setupSlidePopup: function(evt) {
    	var currElement = evt.currentTarget,
    		popupMenu = $('#slidePopupMenu');
    	popupMenu.find('.actView').attr('href', 'story.html?coverid=' + evt.data.coverid);
    	popupMenu.find('.actEdit').attr('href', 'storyedit.html?mode=update&pageid=' + evt.data.pageid);
    },
    initSwiper: function(slideSwiper, container, options) {
    	if (app[slideSwiper]) {
    		app[slideSwiper].reInit();	
    	}
    	else {
    		app[slideSwiper] = $(container).swiper(options);
    	}    	
    },
    initSwiperNested: function(slideSwiper, name, container, options) {
    	if (!app[slideSwiper]['nested']) {
    		app[slideSwiper]['nested'] = {};
    	}
    	if (app[slideSwiper]['nested'][name]) {
    		app[slideSwiper]['nested'][name].reInit();
    	}
    	else {
    		app[slideSwiper]['nested'][name] = $(container).swiper(options);
    	}
    },
    parseQueryString: function(qstring) {
    	var tmp = qstring.replace('?', ''),    		
    		result = {},
    		len, 
    		part;
    	tmp = tmp.split('&');
    	len = tmp.length;
    	for (var i = 0; i < len; i++) {
    		part = tmp[i].split('=');
    		result[part[0]] = part[1];
    	}
    	return result;
    },
    onPageContainerChange: function(evt, data) {
		if (data.toPage.is('#discoverpage')) {
			app.db.transaction(app.getDbStories, app.onTransError, app.onTransSuccess);
			$("#discoverpage>[data-role=header]").toolbar( "option", "fullscreen", true );			
		}
	    else if (data.toPage.is('#storypage')) {
	    	app.db.transaction(app.getDbCurrStory, app.onTransError, app.onTransSuccess);	    		    		    			    		    	
		}
	    else if (data.toPage.is('#storyeditpage')) {
	    	var currPage = $.mobile.path.parseLocation(),
	    		params = app.parseQueryString(currPage.search),
	    		currStory = app.currStory,
	    		simpleEditorBtnOption = ['insertPic'],
	    		fullEditorBtnOption = [
	    			"bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "fontFamily", "fontSize", "color", "formatBlock", 
        			"blockStyle", "align", "insertOrderedList", "insertUnorderedList", "outdent", "indent", "selectAll",   
        			"insertVideo", "undo", "removeFormat", "redo", 
        			// "insertHorizontalRule", 
        			// "table", 
        			'html', 'insertPic'
	    		],
	    		editorOptions = {
	    			inlineMode: false,
        			height: app.getEditorDimension(),
        			imageUpload: false,
        			maxWidth: 1478,
        			maxHeight: 924,
        			// toolbarFixed: true,
        			placeholder: "Start editing your page here...",
        			customButtons: {
		        		insertPic: {
		        			title: 'Insert Picture',
		        			icon: {
		        				type: 'font',
		        				value: 'fa fa-image'
		        			},
		        			callback: function() {
		        				function uploadPhoto(imageURI) {
						            var options = new FileUploadOptions();
						            options.fileKey="file";
						            options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
						            options.mimeType="image/jpeg";
						 
						            var params = new Object();
						            params.value1 = "test";
						            params.value2 = "param";
						 
						            options.params = params;
						            options.chunkedMode = false;
						 
						            var ft = new FileTransfer();
						            ft.upload(imageURI, "http://i.froala.com/upload", win, fail, options);
						        }
						        function win(r) {
						            var image = $.parseJSON(r.response);
						            $('.editor').editable('writeImage', image.link, true);
						        }					 
						        function fail(error) {
						            navigator.notification.alert("An error has occurred: Code = " + error.code, function() {});
						        }
		        				navigator.camera.getPicture( 
		        					// uploadPhoto,
		        					function(imageURI) {
		        						// var filename = imageURI.substr(imageURI.lastIndexOf('/')+1);
		        						$('.editor').editable('writeImage', imageURI, false);
		        					},
		        					function(message) {
										navigator.notification.alert('get picture failed', function() {});
									},
									{
										quality: 50, 
										destinationType: Camera.DestinationType.FILE_URI,
										sourceType: Camera.PictureSourceType.PHOTOLIBRARY
									}
						        );
		        			},
		        			refresh: function() {}
		        		}
		        	}
	    		},
	    		backupStory = function(storyObj) {
	    			var objTmp = {};
	    			for (var key in storyObj) {
	    				objTmp[key] = storyObj[key];
	    			}
	    			return objTmp;
	    		};
	    	app.storyBak = backupStory(currStory);
	    	$("#storyeditpage>[data-role=header]").toolbar( "option", "fullscreen", true );	
	    	$('#storyeditpage #insertPhoto').on('tap', function() {
				$('#imagePopupMenu').popup("open", {
    				transition: 'pop',
    				positionTo: '#storyeditpage #insertPhoto'
    			});
    			$('#imagePopupMenu').on('tap', function() {
    				$(this).popup('close');	
    			});
			});    	
	    	data.toPage.data(params);	    	
	    	if (data.toPage.data('mode') == 'insert') {
	    		$('a[href="#actions-form"]').hide();
	    		if (data.toPage.data('coverid') == 0) {
	    			$('#storyeditpage [data-role=header]>h1').text('Add Story: Cover Page');
	    			// $('.editor img.story-image').on('taphold', function() {app.getPicture();});	    			
	    			$('#storyeditpage .actTakePicture').on('tap', function() {
	    				app.getPicture(
		    				function(imageURI) {		    					
								$('.story-image').attr('src', imageURI);
		    				}, 
		    				function(message) {
								$(':mobile-pagecontainer').pagecontainer('change', 'index.html');
							},
		    				{
					    		quality: 50, 
								destinationType: 1,//Camera.DestinationType.FILE_URI,
								sourceType: 1//Camera.PictureSourceType.CAMERA
				    		}
			    		);
			    	});
			    	$('#storyeditpage .actSelectPhoto').on('tap', function() {
			    		app.getPicture(
				    		function(imageURI) {
								$('.story-image').attr('src', imageURI);
		    				}, 
		    				function(message) {
								$(':mobile-pagecontainer').pagecontainer('change', 'index.html');
							}, 
				    		{
					    		quality: 50, 
								destinationType: 1,//Camera.DestinationType.FILE_URI,
								sourceType: 0//Camera.PictureSourceType.PHOTOLIBRARY
				    		}
				    	);
			    	});
	    			app.currStory.reset({
		    			level: 1,
				    	pageorder: 1,
				    	inspired: 0,
				    	comments: 0,
		    		});
		    		app.currStory.updateStatus(function() {
		    			$('#savePage').attr('href', 'story.html?coverid=' + (app.currStory.status.maxCoverId + 1));	
		    			$('#cancelPage').attr('href', 'index.html');
		    		});
		    		// app.getPicture();
		    		$('#storyeditpage #insertPhoto').trigger('tap');	    			    		
	    		}
	    		else if (!data.toPage.data('parent') && data.toPage.data('coverid') != 0) {
	    			var coverId = data.toPage.data('coverid');
		    		$('#storyeditpage [data-role=header]>h1').text('Add Story: Page');
	    			$('#storyeditpage .actTakePicture').on('tap', function() { 
	    				app.getPicture(
		    				function(imageURI) {
								$('.story-image').attr('src', imageURI);
		    				}, 
		    				function(message) {
								$(':mobile-pagecontainer').pagecontainer('change', 'story.html?' + coverId);
							}, 
							{
					    		quality: 50, 
								destinationType: 1,//Camera.DestinationType.FILE_URI,
								sourceType: 1//Camera.PictureSourceType.CAMERA
							}
			    		);
			    	});
			    	$('#storyeditpage .actSelectPhoto').on('tap', function() {
			    		app.getPicture(
				    		function(imageURI) {
								$('.story-image').attr('src', imageURI);
		    				}, 
				    		function(message) {
								$(':mobile-pagecontainer').pagecontainer('change', 'story.html');
							}, 
				    		{
					    		quality: 50, 
								destinationType: 1,//Camera.DestinationType.FILE_URI,
								sourceType: 0//Camera.PictureSourceType.PHOTOLIBRARY
				    		}
				    	);
			    	});
		    		app.currStory.reset({
		    			coverId: coverId,
		    			level : 1,
		    			parent : 0	
		    		});
		    		// app.getPicture();
		    		$('#storyeditpage #insertPhoto').trigger('tap');
		    		$('.editor+div[data-role=footer]').remove();
		    		$('#savePage').attr('href', 'story.html?coverid=' + coverId);
		    		$('#cancelPage').attr('href', 'story.html?coverid=' + coverId);
	    		}
	    		else if (data.toPage.data('parent') && data.toPage.data('coverid') != 0) {
	    			var coverId = data.toPage.data('coverid'),
	    				currParent = data.toPage.data('parent');
	    			$('#storyeditpage [data-role=header]>h1').text('Add Story: Below Fold');
	    			$('#storyeditpage #insertPhoto').hide();
		    		app.currStory.reset({
		    			coverId: coverId,
		    			level: 2,
		    			parent: currParent
		    		});
		    		editorOptions.buttons = fullEditorBtnOption;
		    		$('#savePage').attr('href', 'story.html?coverid=' + coverId);
		    		$('#cancelPage').attr('href', 'story.html?coverid=' + coverId);
	    			app.currStory.updateStatusCurrStory(function() {
			    		app.currStory.updateStatusBelowFold(function() {
			    			$('.editor').empty();
			    			$('.editor+div[data-role=footer]').remove();
			    			$('.editor').editable(editorOptions);
				    		$('.editor').editable('focus');
				    		$('.editor').editable('setHTML', app.currStory.content);
			    		});
			    	});
	    		}
	    	}
	    	else if (data.toPage.data('mode') == 'update') {	    			    		
	    		app.currStory.fetch(
	    			{pageId : params.pageid},
	    			function() {
	    				var coverId = app.currStory.coverId,
	    					pageId = app.currStory.pageId,
	    					parent = app.currStory.parent,
	    					content = app.currStory.content,
	    					title = app.currStory.title,
	    					subtitle = app.currStory.subtitle,
	    					level = app.currStory.level,
	    					pageorder = app.currStory.pageorder;	    					
	    				$('#savePage').attr('href', 'story.html?coverid=' + coverId);
	    				$('#cancelPage').attr('href', 'story.html?coverid=' + coverId);
	    				$('#addNewPage').attr('href', 'storyedit.html?mode=insert&coverid=' + coverId);
	    				if (level == 1) {
	    					if (pageorder == 1) {
	    						$('#storyeditpage [data-role=header]>h1').text('Edit Story: Cover Page');	    						
	    					}
	    					else {
	    						$('#storyeditpage [data-role=header]>h1').text('Edit Story: Page');	    						
	    					}	    					
	    					$('#addBelowPage').attr('href', 'storyedit.html?mode=insert&coverid=' + coverId + '&parent=' + pageId);
	    					$('.editor').html(content);
	    					// $('.editor img.story-image').on('taphold', function() {app.getPicture();});
    						$('#storyeditpage .actTakePicture').on('tap', function() {
    							app.getPicture(
				    				function(imageURI) {
										$('.story-image').attr('src', imageURI);
				    				}, 
				    				false, 
									{
							    		quality: 50, 
										destinationType: 1,//Camera.DestinationType.FILE_URI,
										sourceType: 1//Camera.PictureSourceType.CAMERA
									}
						    	);
					    	});
					    	$('#storyeditpage .actSelectPhoto').on('tap', function() {
					    		app.getPicture(
						    		function(imageURI) {
										$('.story-image').attr('src', imageURI);
				    				}, 
						    		false,
						    		{
							    		quality: 50, 
										destinationType: 1,//Camera.DestinationType.FILE_URI,
										sourceType: 0//Camera.PictureSourceType.PHOTOLIBRARY
						    		}
						    	);
					    	});
	    					$('input[name=story-title]').val(title);
	    					$('input[name=story-subtitle]').val(subtitle);	    					
	    					if (pageorder > 1) {
	    						$('.editor+div[data-role=footer]').remove();
	    					}
	    				}
	    				else if (level == 2) {
	    					$('#storyeditpage [data-role=header]>h1').text('Edit Story: Below Fold');
	    					$('#storyeditpage #insertPhoto').hide();
	    					$('#addBelowPage').attr('href', 'storyedit.html?mode=insert&coverid=' + coverId + '&parent=' + parent);
	    					app.currStory.updateStatusCurrStory(function() {
					    		app.currStory.updateStatusBelowFold(function() {
					    			editorOptions.buttons = fullEditorBtnOption;
					    			$('.editor').empty();
					    			$('.editor+div[data-role=footer]').remove();
					    			$('.editor').editable(editorOptions);
						    		$('.editor').editable('focus');
						    		$('.editor').editable('setHTML', content);
					    		});
					    	});
	    				}
	    			}
	    		);	    			    		
	    	}	    	
	    	app.saveStorySuccess = false;
	    	app.changeEditorLayout();	    	
	    	$('#storyeditpage #cancelPage').on('tap', function(evt) {
	    		var target = evt.currentTarget;
	    		evt.preventDefault();
	    		app.currStory.modify(app.storyBak);
	    		$(':mobile-pagecontainer').pagecontainer('change', $(target).attr('href'));
	    	});	    	
	    	$('#storyeditpage #savePage').on('tap', function(evt) {
	    		var target = evt.currentTarget;
	    		evt.preventDefault();
	    		if (app.currStory.level == 1) {
	    			if ($('input#story-title, input#story-subtitle').length > 0) {
		    			app.currStory.modify({
			    			title: $('input[name=story-title]').val(),
			    			subtitle: $('input[name=story-subtitle]').val(),
			    			content: $('.editor').html()
			    		});	
		    		}
		    		app.currStory.modify({
		    			content: $('.editor').html()
		    		});	
	    		}
	    		else if (app.currStory.level == 2) {
	    			app.currStory.modify({		    			
		    			content: $('.editor').editable('getHTML', false, true)
		    		});
	    		}
	    			    		
	    		if ($('#storyeditpage').data('mode') == 'update') {
	    			app.currStory.updateStory(function() {
	    				$(':mobile-pagecontainer').pagecontainer('change', $('#savePage').attr('href'));	
	    			});		    			
	    		}
	    		else {
	    			app.currStory.updateStatusCurrStory(
	    				function() {
	    					app.currStory.updateStatusBelowFold(app.currStory.insertStory(function() {
			    				$(':mobile-pagecontainer').pagecontainer('change', $('#savePage').attr('href'));	
			    			}));
	    				}
	    			);
	    		}
	    				    				    		
	    	});
	    };	    
    },
    storyGetFocus: function() {
    	var storySwiper = app.storySwiper,
    		focusOnSlide = function(swiper, slideId) {
    			var len = swiper.slides.length,
    				slide;
    			for (var i = 0; i < len; i++) {
		    		slide = swiper.getSlide(i)	;
		    		if ($(slide).data('storyid') == slideId) {
		    			swiper.swipeTo(i);
		    			return true;
		    		}
		    	}
		    	return false;
    		};
    	if (app.currStory.parent != 0) {
    		for (var item in storySwiper.nested) {
    			if (focusOnSlide(storySwiper.nested[item], app.currStory.pageId)) {
    				break;
    			};
    		}
    		focusOnSlide(storySwiper, app.currStory.parent);
    	}
    	else {
    		focusOnSlide(storySwiper, app.currStory.pageId);	
    	}
    },
    changeSwiperLayout: function() {					
		//Get Size
		var	sd = app.swiperDimensions,
			winHeight = $(window).height(),
			winWidth = $(window).width(),
			currPage = $.mobile.activePage,
			// headerHeight = $.mobile.activePage.find('[data-role=header]').outerHeight(),
			// swiperHeight = winHeight - headerHeight,
			// swiperHeight = winHeight,
			// ratio = (winWidth / swiperHeight <= sd.slideWHRatio) ? winWidth / sd.slideWidthScaled : swiperHeight / sd.slideHeightScaled,
			ratio = (winWidth / winHeight <= sd.slideWHRatio) ? winWidth / sd.slideWidthScaled : winHeight / sd.slideHeightScaled,
			stretchRatio = currPage.is('#storypage') ? 1 : 0.8,
			swiperHeight = ratio * sd.slideHeightScaled,
			slideWidthNew = stretchRatio * ratio * sd.slideWidthScaled,
			slideHeightNew = stretchRatio * ratio * sd.slideHeightScaled;
		$('.swiper-container.swiper-parent').innerHeight(swiperHeight);
		// $('.swiper-container.swiper-parent').css('margin-top', headerHeight + 'px');
		$('.swiper-container.swiper-child').innerWidth(slideWidthNew);
		$('.swiper-container.swiper-child').innerHeight(slideHeightNew);
	},
	changeEditorLayout: function() {
		var editorWidthOrin = 1478,
			editorHeightOrin = 924,
			winWidth = $(window).width(),
			winHeight = $(window).height(),
			scaleWRatio = winWidth / editorWidthOrin,  
			editorWidth = scaleWRatio * editorWidth,
			editorHeight = scaleWRatio * editorHeightOrin;		
		$('.editor').css('-webkit-transform', 'scale(' + scaleWRatio + ')');
		$('.editor').css('-moz-transform', 'scale(' + scaleWRatio + ')');
		$('.editor').css('-ms-transform', 'scale(' + scaleWRatio + ')');
		$('.editor').css('-o-transform', 'scale(' + scaleWRatio + ')');
		$('.editor').css('transform', 'scale(' + scaleWRatio + ')');
		$('.editor-wrapper').innerWidth(editorWidth);
		$('.editor-wrapper').innerHeight(editorHeight);
	},
	getEditorDimension: function() {
		var winHeight = $(window).height(),
			headerHeight = $('#storyeditpage>[data-role=header]').height(),
			footerHeight = $('#storyeditpage>[data-role=footer]').height(),
			editorHeight = winHeight - headerHeight - footerHeight > 924 ? 0.9 * 924 : 0.9 * (winHeight - headerHeight - footerHeight);
		return editorHeight;
	},
	changeSlideDimension: function(slide) {
		var sd = app.swiperDimensions,
			winHeight = $(window).height(),
			winWidth = $(window).width(),
			currPage = $.mobile.activePage,
			// headerHeight = $.mobile.activePage.find('[data-role=header]').outerHeight(),
			// swiperHeight = winHeight - headerHeight,
			// swiperHeight = winHeight,
			// ratio = (winWidth / swiperHeight <= sd.slideWHRatio) ? winWidth / sd.slideWidthScaled : swiperHeight / sd.slideHeightScaled,
			ratio = (winWidth / winHeight <= sd.slideWHRatio) ? winWidth / sd.slideWidthScaled : winHeight / sd.slideHeightScaled,
			stretchRatio = currPage.is('#storypage') ? 1 : 0.8,
			swiperHeight = ratio * sd.slideHeightScaled,
			slideWidthNew = stretchRatio * ratio * sd.slideWidthScaled,
			slideHeightNew = stretchRatio * ratio * sd.slideHeightScaled,
			slideHMargin = 	((1 - stretchRatio) * swiperHeight) / 2,
			transformScaleRatio = stretchRatio * ratio * sd.scaleRatio,
			slideInner = slide.find('.inner');
		slideInner.css('-webkit-transform', 'scale(' + (transformScaleRatio) + ')');
		slideInner.css('-moz-transform', 'scale(' + (transformScaleRatio) + ')');
		slideInner.css('-ms-transform', 'scale(' + (transformScaleRatio) + ')');
		slideInner.css('-o-transform', 'scale(' + (transformScaleRatio) + ')');
		slideInner.css('transform', 'scale(' + (transformScaleRatio) + ')');		
		slide.innerWidth(slideWidthNew);
		slide.innerHeight(slideHeightNew);
		// slide.css('margin', slide.parents('.slide-nested').length > 0 ? '0' : slideHMargin + 'px 0');
		slide.css('margin', currPage.is('#storypage') ? '0' : slideHMargin + 'px 0');
	},
	onStorySuccess: function(tx, result) {
		console.log('Story saved successfully!');
	},
	onStoryError: function(tx, error) {		
		console.log('Save story error: ' + error.message);
	},
	onStoryPageSuccess: function(tx, result) {
		app.saveStorySuccess = true;
		console.log('Story page saved successfully!');
	},
	onStoryPageError: function(tx, error) {		
		console.log('Save story page error: ' + error.message);
	},
	onBelowFoldSuccess: function(tx, result) {
		app.saveStorySuccess = true;
		console.log('Below the fold saved successfully!');
	},
	onBelowFoldError: function(tx, error) {		
		console.log('Save below the fold error: ' + error.message);
	}
};

app.initialize();
// var discoverSwiper = $('#discoverpage .swiper-container.swiper-parent').swiper({
	// centeredSlides: true,
	// slidesPerView: 'auto'
// });