Router.configure({
  notFoundTemplate: 'notFound'
});
Router.route('/',function(){
	this.render('Via');
},{
	name:'home',
	fastRender:true,
	onRun:function(){						//on initial load, will scrollTo hash
		var hash = window.location.hash;
		Meteor.setTimeout(function(){
			viaScrollTo(hash);
		});
		this.next();
	}
});
Router.route('/edit',function(){
	this.render('editDash');
});
Router.route('/edit/:tab',function(){
	var tab = this.params.tab;
	this.render('editDash',{data:{tab:tab}});
});
Router.route('test',function(){
	this.render('test');
});

if(Meteor.isClient){
	Router._scrollToHash = viaScrollTo;
}

function viaScrollTo(hash) {
  var section = $(hash);
  if (section.length) {
    var sectionTop = section.offset().top + 5;
    $("html, body").animate({
      scrollTop: sectionTop
    }, 350,function(){
    	console.log('HIDE NAV');
    	Meteor.setTimeout(function(){
    		Session.set('isNavHidden',true);
    	},10);
    });
  }
};