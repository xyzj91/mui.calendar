/**
   * 日历插件，BY Alen 2016.9.7  解决了左右滚动太灵敏的问题
   * 注意，该插件仅适用于基于mui的webapp项目，其他web项目若想使用该插件请导入mui.js
   * @param {Object} $
   * @param {Object} window
   */
(function($, window) {
	var CALENDAR_SLIDER = "calendar-slider";//日历控件 控件父DOM
	var CALENDAR_LOOP = "calendar-loop";//日历控件控件日期月分组页DOM
	var CLASS_SLIDER = CALENDAR_SLIDER;
	var CLASS_SLIDER_GROUP = 'mui-slider-group';
	var CLASS_SLIDER_LOOP = 'mui-slider-loop';
	var CLASS_SLIDER_INDICATOR = 'mui-slider-indicator';
	var CLASS_ACTION_PREVIOUS = 'mui-action-previous';
	var CLASS_ACTION_NEXT = 'mui-action-next';
	var CLASS_SLIDER_ITEM = 'mui-slider-item';
	var DAYID = "day-";
	var SELECT_DAY = "day-select";
	var SHOW = "mui-block";
	var HIDE = "mui-hidden";
	var YEAR_UNIT = "-";//年单位
	var MONTH_UNIT = "";//月单位
	var DAY_UNIT ="";//日单位
	var NATIVEPATH="";//地址
	//显示样式配置
	var DAYSTATE = {
		lock:"day-lock",//档期满
		pingdan:"day-pindan",//可拼单
		rest:"day-rest",//休息(旅拍)
		select:"day-select",//选中
		default:"day-normal",//默认
		over:"day-over",//过期
		secret:"day-secret"//保密
	};
	
	var css_Style='';

	var CLASS_ACTIVE = 'mui-active';

	var SELECTOR_SLIDER_ITEM = '.' + CLASS_SLIDER_ITEM;
	var SELECTOR_SLIDER_INDICATOR = '.' + CLASS_SLIDER_INDICATOR;
	var SELECTOR_SLIDER_PROGRESS_BAR = '.mui-slider-progress-bar';
	var currenttime,daystates,run;
	
	var Calendar = $.Calendar = $.Slider.extend({
		init: function(element, options) {
			currenttime = this.getCurrentTime();//取得当前时间
			this.options = $.extend(true, {
				fingers: 1,
				interval: 0, //设置为0，则不定时轮播
				scrollY: false,
				scrollX: true,
				indicators: false,
				scrollTime: 1000,
				startX: false,
				slideTime: 0, //滑动动画时间
				snap: SELECTOR_SLIDER_ITEM,//绑定事件DOM
				time:{//时间
					year:currenttime.year,
					month:currenttime.month+1,
				},
				year_unit:YEAR_UNIT,
				month_unit:MONTH_UNIT,
				day_unit:DAY_UNIT,
				nativepath:NATIVEPATH,//本地路径
				calendar_slider:CALENDAR_SLIDER,//日历控件 class
				calendar_loop:CALENDAR_LOOP,//日历控件基础DOM class
				daystate:DAYSTATE,//日期状态
				showdate:false,//事件显示dom
				smallChange:false,//是否可以多选
				select_day:SELECT_DAY,//默认选中的样式
				next_item:false,//上一个页面切换监听节点class
				last_item:false,//下一个页面切换监听节点class
				clickCallback:false,//点击回调
				dragCallback:false//滑动回调
			}, options);
			run = true;
			this.options.nativepath +="/"; 
			this.daystate = this.options.daystate;//设置全局日历状态样式
			this.changeGroup = [];//选中的数组
			this._super(element, this.options);
		},
		//初始化日历插件
		_init: function() {
			this._reInit();
			if (this.scroller) {
				this.scrollerStyle = this.scroller.style;
				this.progressBar = this.wrapper.querySelector(SELECTOR_SLIDER_PROGRESS_BAR);
				if (this.progressBar) {
					this.progressBarWidth = this.progressBar.offsetWidth;
					this.progressBarStyle = this.progressBar.style;
				}
				this.year = this.options.time.year;
				this.month = this.options.time.month;
				this.createCalendarPanel();//创建日历界面
				this.SHOWDATE_DOM = this.options.showdate?this.element.querySelector("."+this.options.showdate):false;
				if(this.SHOWDATE_DOM){
					this.SHOWDATE_DOM.innerHTML = this.year+this.options.year_unit+this.month+this.options.month_unit;
				}
				var self = this;
				//下一月点击
				if(this.options.next_item){
					this.element.querySelector("."+this.options.next_item).addEventListener("tap",function(){
						self.nextItem();
					});
				}
				//上一月点击
				if(this.options.last_item){
					this.element.querySelector("."+this.options.last_item).addEventListener("tap",function(){
						self.lastItem();
					});
				}
				var elements = this.element.querySelectorAll(SELECTOR_SLIDER_ITEM);
				this.calendarDom = elements[self.slideNumber+1];//获取当前日历DOM
				this._super();
				this._initTimer();
			}
		},
		//滑动完成，触发事件
		_triggerSlide: function(e) {
			var self = this;
			self.isInTransition = false;
			var page = self.currentPage;
			self.slideNumber = self._fixedSlideNumber();
			if (self.loop) {
				if (self.slideNumber === 0) {
					self.setTranslate(self.pages[1][0].x, 0);
				} else if (self.slideNumber === self.itemLength - 3) {
					self.setTranslate(self.pages[self.itemLength - 2][0].x, 0);
				}
			}
			if (self.lastSlideNumber != self.slideNumber) {
				self.lastSlideNumber = self.slideNumber;
				self.lastPage = self.currentPage;
				$.trigger(self.wrapper, 'slide', {
					slideNumber: self.slideNumber,
					direction:e.detail.direction
				});
			}
			self._initTimer();
		},
		_flick: function(e) {
			if (!this.moved) { //无moved
				return;
			}
			var detail = e.detail;
			var direction = detail.direction;
			this._clearRequestAnimationFrame();
			this.isInTransition = true;
			if (e.type === 'flick') {
				if (detail.deltaTime < 200) { //flick，太容易触发，额外校验一下deltaTime  
					if(Math.abs(detail.deltaX)-Math.abs(detail.deltaY)>=90){//Alen 增加X,Y轴滚动差判断，以防止上下滚动时也触发切换
						this.x = this._getPage((this.slideNumber + (direction === 'right' ? -1 : 1)), true).x;
					}
				}
				this.resetPosition(this.options.bounceTime);
			} else if (e.type === 'dragend' && !detail.flick) {
				this.resetPosition(this.options.bounceTime);
			}
			e.stopPropagation();
		},
		/**
		 * 滚动到第几帧 该方法是手动触发的
		 * @param {Number} slideNumber  页面数量
		 * @param {String} time   动画时间
		 * @param {String} dire   滚动方向
		 */
		_gotoItem: function(slideNumber, time,dire) {
			this.currentPage = this._getPage(slideNumber, true); //此处传true。可保证程序切换时，动画与人手操作一致(第一张，最后一张的切换动画)
			this.scrollTo(this.currentPage.x, 0, time, this.options.scrollEasing);
			if(dire){
				this.direction = dire;
			}
			if (time === 0) {
				$.trigger(this.wrapper, 'scrollend', this);
			}
		},
		_handleSlide: function(e) {//滑动完成后触发
			var self = this;
			if (e.target !== self.wrapper) {
				return;
			}
			var detail = e.detail;
			detail.slideNumber = detail.slideNumber || 0;
			var temps = self.scroller.querySelectorAll(SELECTOR_SLIDER_ITEM);
			var items = [];
			for (var i = 0, len = temps.length; i < len; i++) {
				var item = temps[i];
				if (item.parentNode === self.scroller) {
					items.push(item);
				}
			}
			var _slideNumber = detail.slideNumber;
			if (self.loop) {
				_slideNumber += 1;
			}
			if (!self.wrapper.classList.contains('mui-segmented-control')) {
				for (var i = 0, len = items.length; i < len; i++) {
					var item = items[i];
					if (item.parentNode === self.scroller) {
						if (i === _slideNumber) {
							item.classList.add(CLASS_ACTIVE);
							this.changeCelendar(item,e.detail);
						} else {
							item.classList.remove(CLASS_ACTIVE);
						}
					}
				}
			}
			var indicatorWrap = self.wrapper.querySelector('.mui-slider-indicator');
			if (indicatorWrap) {
				if (indicatorWrap.getAttribute('data-scroll')) { //scroll
					$(indicatorWrap).scroll().gotoPage(detail.slideNumber);
				}
				var indicators = indicatorWrap.querySelectorAll('.mui-indicator');
				if (indicators.length > 0) { //图片轮播
					for (var i = 0, len = indicators.length; i < len; i++) {
						indicators[i].classList[i === detail.slideNumber ? 'add' : 'remove'](CLASS_ACTIVE);
					}
				} else {
					var number = indicatorWrap.querySelector('.mui-number span');
					if (number) { //图文表格
						number.innerText = (detail.slideNumber + 1);
					} else { //segmented controls
						var controlItems = indicatorWrap.querySelectorAll('.mui-control-item');
						for (var i = 0, len = controlItems.length; i < len; i++) {
							controlItems[i].classList[i === detail.slideNumber ? 'add' : 'remove'](CLASS_ACTIVE);
						}
					}
				}
			}
			e.stopPropagation();
		},
		refresh: function(options) {
			if (options) {
				$.extend(this.options, options);
				this._super();
				this._initTimer();
				this._initAllDayState();//初始化日历面板
				this.year = this.options.time.year;
				this.month = this.options.time.month;
				this.createCalendarPanel();//创建日历界面
				if(this.SHOWDATE_DOM){
					this.SHOWDATE_DOM.innerHTML = this.year+this.options.year_unit+this.month+this.options.month_unit;
				}
			} else {
				this._super();
			}
		},
		destroy: function() {
			this._initEvent(true); //detach
			delete $.data[this.wrapper.getAttribute('calendar-slider')];
			this.wrapper.setAttribute('calendar-slider', '');
		},
		//下一个月
		nextItem:function(){
			this._gotoItem(this.slideNumber + 1, this.options.scrollTime,"left");
		},
		//上一个月
		lastItem:function(){
			this._gotoItem(this.slideNumber - 1, this.options.scrollTime,"right");
		},
		//获取当前系统时间函数
		getCurrentTime:function(){
			var current = {};
			var current_time = new Date(); //当前时间
			current['year'] = current_time.getFullYear();//当前年
			current['month'] = current_time.getMonth();//当前月
			current['day'] = current_time.getDate();//当前日
			current['hour'] =current_time.getHours()<10?"0"+current_time.getHours():current_time.getHours();//当前时
			current['min'] = current_time.getMinutes()<10?"0"+current_time.getMinutes():current_time.getMinutes();//当前分
			return current;
		},
		//设置参数到当前插件对象中
		setinfo:function(info){
			this.info = info;
		},
		//在当前对象中获取参数
		getinfo:function(){
			return this.info;
		},
		//设置指定日期状态
		setDaySate:function(day,state,removeStyleName){
			if(!day){
				console.error("请输入正确的参数day");
				return false;
			}else if(!state){
				console.error("请输入正确的参数state");
				return false;
			}
			//此处这样判断可以防止已过期的日期被设置状态
			if(parseInt(this.year)<parseInt(this.getCurrentTime()['year'])){//小于当前年
				return false;
			}
			if(parseInt(this.year)==parseInt(this.getCurrentTime()['year'])){//同年
				if(parseInt(this.month)<parseInt(this.getCurrentTime()['month'])+1){//小于当前月
					return false;
				}
				if(parseInt(this.month)==parseInt(this.getCurrentTime()['month'])+1&&parseInt(day)<parseInt(this.getCurrentTime()['day'])){//同月且小于当前日
					return false;
				}
			}
			var dayDom = this.calendarDom.querySelector("#"+DAYID+day);//取得指定的日期dom
			//移除指定的class
			if(removeStyleName===true){//移除所有class
				mui.each(DAYSTATE,function(k,v){
					if(dayDom.classList.contains(v)){
						dayDom.classList.remove(v);
					}
				});
				dayDom.classList.add(state);//添加CSS样式
//				if(state==this.options.select_day){
				dayDom.querySelector(".jiao").classList.remove(SHOW);
//				}
			}else if(removeStyleName){
				if(dayDom.classList.contains(removeStyleName)){
					dayDom.querySelector(".jiao").classList.remove(SHOW);
					dayDom.classList.remove(removeStyleName);
				}
			}else{
				dayDom.classList.add(state);//添加CSS样式
				if(state==this.options.select_day){
					dayDom.querySelector(".jiao").classList.add(SHOW);
				}
			}
		},
		_selectDay:function(day){
			var self =this;
			//删除其他选项的CSS属性
			mui.each(this.calendarDom.querySelectorAll("."+DAYSTATE.select),function(k,v){
				var otherday = parseInt(v.querySelector("span").innerHTML);
				self.setDaySate(otherday,DAYSTATE.secret,DAYSTATE.select);
			});
			self.setDaySate(day,DAYSTATE.secret);//设置选中
		},
		//初始化所有日期状态
		_initAllDayState:function(){
			var self = this;
			mui.each(this.calendarDom.querySelectorAll("li"),function(k,v){
				if(v.querySelector("span").innerHTML){
					var day = v.querySelector("span").innerHTML;
					if(day){
						day = parseInt(day);
						if(day){
							self.setDaySate(day,DAYSTATE.secret,true);
						}
					}
				}
			});
		},
		//获取指定日期状态
		getDayState:function(day){
			if(!day){
				console.error("请输入正确的参数");
			}
			var dayDom = this.calendarDom.querySelector("#"+DAYID+day);//取得指定的日期dom
			var clas="";
			for (var i = 0; i < dayDom.classList.length; i++) {
				clas +=dayDom.classList[i]+" ";
			}
			return clas;
		},
		//设置当前帧面板的日期状态
		setCalendar:function(options){
			var self = this;
			$.each(options, function(k,v) {
				self.setDaySate(v.day,v.state);
			});
		},
		//设置时间显示面板状态
		setViewDayPanel:function(day){
			day = day?day:this.day;
			if(this.SHOWDATE_DOM){
				this.SHOWDATE_DOM.innerHTML = this.year+this.options.year_unit+this.month+this.options.month_unit+day+this.options.day_unit;
			}
		},
		//切换日期
		changeCelendar:function(element,data){
			if(!data.direction){
				return false;
			}
			var year = this.year;
			var month = this.month;
			if(data.direction=="left"){//向左滑动
				month = parseInt(month)+1;
				if(month>12){
					month = 1;
					year = parseInt(year)+1;
				}
			}else{
				month = parseInt(month)-1;
				if(month<1){
					month = 12;
					year = parseInt(year)-1;
				}
			}
			console.error(year+"--"+month);
			if(this.SHOWDATE_DOM){
				this.SHOWDATE_DOM.innerHTML = year+this.options.year_unit+month+this.options.month_unit;
			}
			this.year = year;
			this.month = month;
			this.createCalendarPanel(element);
			this.changeGroup = [];//清空选中数组
			this.day = "";
			//滑动回调事件
			if ($.isFunction(this.options.dragCallback)){
				this.options.dragCallback(this);
			}
		},
		_changeDay:function(day){
			if(!day){
				return;
			}
			var dayDom = this.calendarDom.querySelector("#"+DAYID+day);//取得指定的日期dom
			var self = this;
			if(dayDom.classList.contains(this.options.select_day)){//判断是否是选中状态
//				如果是取消选中则删除当前元素
				$.each(this.changeGroup, function(k,v) {
					if(v==day){
						self.changeGroup.splice(k,1);//删除指定元素
						return;
					}
				});
				if(this.options.smallChange===false){//如果是单选
					self._selectDay(day);//删除所有元素的选中状态
				}else{
					this.setDaySate(day,this.options.select_day,this.options.select_day);
				}
			}else{
				if(this.options.smallChange===false){//如果是单选
					if(this.changeGroup.length>=1){
						var lastday = this.changeGroup.pop();
						this.setDaySate(lastday,this.options.select_day,this.options.select_day);//删除队尾的数据并改变其选中状态
					}
					self._selectDay(day);//删除所有元素的选中状态
				}
				this.setDaySate(day,this.options.select_day);
				this.changeGroup.push(day);//将新数据插入数组中
			}
			self.day = day;//设置全局日期
			self.setViewDayPanel();//设置面板
			
		},
		//设置当前日期选中状态
		changeDay:function(day){
			var dayDom = this.calendarDom.querySelector("#"+DAYID+day);//取得指定的日期dom
			mui.trigger(dayDom,"tap");//触发点击事件
		},
		//创建当前日历插件
		createCalendarPanel:function(element){
			this.caledarDomClass = this.options.calendar_loop;
			var currentdate = this.getCurrentTime();
			if(this.year<1970|| this.month < 0 || this.month > 12){
				console.error("时间参数错误");
				return false;
			}
			var date = new Date(this.year, this.month, 0); 
			var datecount = date.getDate(); //总天数
			var self = this;
			var day = new Date(this.year, this.month - 1, 1);
			var week = day.getDay(); //1号星期几 
//			alert(week);
			datecount += week;
			var dom = "";
			var thisday = 0;
			
			css_Style=this.options.daystate.secret;
			
			for (var i = 0; i < datecount; i++) {
				if(i<week){
					dom+='<li class="day day-normal"><span></span><div class="rest-icon"></div></li>';
				}else{
					 thisday = i-week+1;
					if (this.year <= currentdate["year"]) {//传递年份小于或等于当前年份
						var dayState = '';
					if (this.year == currentdate['year']&&this.month > (currentdate['month'] + 1)) {//传递年份等于当前年份且月份大于当前月份
						dayState = css_Style;
					} else {
						if(this.month == (currentdate['month'] + 1)){//传递月份等于当前月份
							dayState = i < currentdate['day'] + (week-1)?this.options.daystate.over:css_Style;
						}else{//传递月份小于当前月份
//							if (i < currentdate['day'] + (week-1) || this.month < (currentdate['month'] + 1) || this.year < currentdate['year']) {
								dayState = this.options.daystate.over;
//							} else {
//								dayState = css_Style;
//							}
						}
					}
					
					dom += '<li class="day ' + dayState + '" id="'+DAYID+thisday + '" day="'+thisday+'"><span>' + thisday + '</span><div class="rest-icon"></div><div class="jiao"></div></li>';
					}else{
						dom += '<li class="day day-secret" id="' +DAYID+thisday+ '" day="'+thisday+'"><span>' + thisday + '</span><div class="rest-icon"></div><div class="jiao"></div></li>';
					}
				}
			}
			this.slideNumber = this.slideNumber>0?parseInt(this.slideNumber):0;
			if(element){
				element.innerHTML = dom;
				this.calendarDom = element;
//				alert(element.getAttribute("class"));
			}else{
				if(run==true){
					run = false;
					var elements = this.element.querySelectorAll(SELECTOR_SLIDER_ITEM);
					mui(elements).each(function(k,v){//默认首次进来5个DOM全部填上初始数据
						if(k==(self.slideNumber+1)){
							this.calendarDom = v;
						}
						v.innerHTML = dom;
						//页面点击监听事件
						mui(v).on("tap","li",function(data){
							var day = this.getAttribute("day");
							self._changeDay(day);//改变当前日期状态
							if(day){
								if(self.options.clickCallback){
									self.options.clickCallback(self.changeGroup,self);
								}
							}
						});
					});
				}
				
				
			}
		}
		
	});
	$.fn.calendar = function(options) {
		var  calendarApis= [];//日历对象集合
		options = options?options:{};
		this.each(function() {
			var sliderElement = this;
			var calendar = null;
			if (!this.classList.contains(CLASS_SLIDER)) {
				sliderElement = this.querySelector('.' + CLASS_SLIDER);
			}
			if (sliderElement && sliderElement.querySelector(SELECTOR_SLIDER_ITEM)) {
				var id = sliderElement.getAttribute('calendar-slider');
				if (!id) {
					id = ++$.uuid;
					$.data[id] = calendar = new Calendar(sliderElement, options);
					sliderElement.setAttribute('calendar-slider', id);
				} else {
					calendar = $.data[id];
					if (calendar && options) {
						calendar.refresh(options);
					}
				}
			}
			calendarApis.push(calendar);
		});
		return calendarApis.length===1?calendarApis[0]:calendarApis;
	};
//	$.ready(function() {
//		//		setTimeout(function() {
//		$('.mui-slider').slider();
//		$('.mui-scroll-wrapper.mui-slider-indicator.mui-segmented-control').scroll({
//			scrollY: false,
//			scrollX: true,
//			indicators: false,
//			snap: '.mui-control-item'
//		});
//		//		}, 500); //临时处理slider宽度计算不正确的问题(初步确认是scrollbar导致的)
//
//	});
})(mui, window);