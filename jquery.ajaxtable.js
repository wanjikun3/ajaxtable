;
(function($, window, document, undefined) {

	function AjaxTable(element, option) {
		this.w = $(document);
		this.el = $(element);
		var obj = this.el;
		if (obj.data('url')) {
			option.url = obj.data('url');
		}

		if (obj.data('page')) {
			option.page = obj.data('page');
		}else{
			option.page=1;
		}

		if (obj.data('size')) {
			option.size=obj.data("size");
		}else{
			option.size=10;
		}
		
		if (obj.data('sizes')) {
			option.sizes=obj.data("sizes");
		}else{
			option.sizes="10,20,50";
		}
		
		option.sort={name:'',type:''};
		option.form='';
		if (obj.data('filter')) {
			option.filter=obj.data("filter");
		}else{
			option.filter="";
		}
		if (obj.find("thead th").length > 0) {
			option.field = [];
			obj.find("thead th").each(function() {
				var th = $(this);
				var field = th.data('field');
				if (field) {
					field = field.replace(/\'/g, "\"");
					option.field.push($.parseJSON(field));
				}
			});
		}
		
		this.option = option;
		this.init();
	}

	AjaxTable.prototype = {

		init: function() {
			var list = this;
			var obj = list.el;
			temp = "{{each list d i}}<tr>";
			obj.find("thead").html("<tr></tr>");
			$.each(list.option.field, function(i, field) {
				if(field.sort){
					field.class="sort";
				}
				obj.find("thead tr").append("<th " + (field.class ? "class='" + field.class + "'" : "") + ">" + field.label + (field.sort?"<span><i class='sort-asc'></i><i class='sort-desc'></i></span>":"")+ "</th>");
				if (field.tpl) {
					temp += "<td>" + $(field.tpl).html() + "</td>";
				} else {
					temp += "<td>{{ d." + field.name + " }}</td>";
				}
			})
			temp += "</tr>{{/each}}";
			list.temp=temp;
			list.render();
			list.el.on('click', '.page-prev', function(e) {
				e.preventDefault();
				if (list.option.page > 1) {
					list.option.page = list.option.page - 1;
					list.render();
				}
			});
			list.el.on('click', '.page-next', function(e) {
				e.preventDefault();
				if (list.option.page < list.option.pages) {
					list.option.page = list.option.page + 1;
					list.render();
				}
			});
			list.el.on('click', 'tfoot button', function(e) {
				list.option.page = parseInt(list.el.find("tfoot input[type='text']").val());
				if(list.option.page > list.option.pages){
					list.option.page=list.option.pages;
				}else if(list.option.page<1){
					list.option.page=1;
				}
				list.render();
			});
			list.el.on('change', 'tfoot select', function(e) {
				list.option.size = parseInt($(this).val());
				list.option.page=1;
				list.render();
			});
			list.el.on('click', 'th.sort', function(e) {
				if (list.option.sort.name  == list.option.field[$(this).index()].name) {
				    var sort = list.option.sort.type;
				    if (sort=='') {
				        sort = "asc";
				    } else if (sort == "asc") {
				        sort = "desc";
				    } else {
				        sort = "";
				    }
					list.option.sort.type=sort;
				}else{
					list.option.sort.type="asc";
					list.option.sort.name=list.option.field[$(this).index()].name;
				}
				list.el.find("thead th i").removeClass("on");
				$(this).find(".sort-"+list.option.sort.type).addClass("on");
	 
				list.option.page=1;
				list.render();
			});
			
			if(list.option.filter!=''){
				$(document).on('submit', list.option.filter, function(e) {
					e.preventDefault();
					var form_data={};
					$(this).serializeArray().map(function(val,key){
						form_data[val.name]=val.value;
					})
					
					list.option.form=form_data;
					list.option.page=1;
					list.render();
				});
			}
		},

		render: function() {
			var list = this;
			var obj = this.el;
			var para = {
				page:{
					page: list.option.page,
					size: list.option.size
				}
				
			};
			if(list.option.sort.name){
				para['sort']=list.option.sort;
			}
			if(list.option.form){
				para['form']=list.option.form;
				console.log(para);
			}
			console.log(para);
			$.ajax({
				type: 'get',
				url: list.option.url,
				data:para,
				success: function(data) {
					if (data.code == 1) {
						str = template.render(list.temp, data.msg);
						obj.find("tbody").html(str);
					}
					var page_data = [];
					page_data['page'] = list.option.page;
					page_data['count'] = data.msg.count;
					page_data['size'] = list.option.size;
					page_data['sizes'] = list.option.sizes.split(",");
					list.option.count = page_data['count'];
					list.option.pages =Math.ceil(list.option.count / list.option.size);
					var page_str = '<td><a href="#" class="page-prev">上一页</a><span>{{ page }}</span><a href="#" class="page-next">下一页</a>到第<input type="text" value="{{ page }}" >页<button type="button">确定</button>共{{ count }}条<select>{{each sizes val key}}<option value="{{ val }}" {{ val == size ? "selected":"" }} >{{ val }}条/页</option>{{/each}}</select></td>';
					obj.find("tfoot").html(template.render(page_str, page_data));
					obj.find("tfoot td").attr("colspan", list.option.field.length);
					obj.show();
				},
			})

		}
	}






	$.fn.ajaxtable = function(option) {

		var lists = this,
			retval = this;

		lists.each(function() {
			var plugin = $(this).data("ajaxtable");
			if (!plugin) {
				$(this).data("ajaxtable", new AjaxTable(this, option));
			} else {
				if (typeof plugin[option] === 'function') {
					retval = plugin[option]();
				}
			}
		});

		return retval || lists;
	};

})(window.jQuery, window, document);
