# mui.calendar
mui.calendar是一款基于mui框架的日历插件，可以自定义实现任何日历提示效果。用于实现webapp的日历提示功能
      日历插件初始化代码：
      mui(".calendar-box").calendar({
	  		clickCallback:function(){
	  			
	  		},//点击回调
	  		dragCallback:function(){ 
	  			
	  		},//滑动回调
	  		time:{//初始化传递时间
	  			year:year,
	  			month:month
	  		},
	  		year_unit:"年",
	  		month_unit:"月",
	  		day_unit:"日",
	  		showdate:"this-time"//时间显示面板
	    });
