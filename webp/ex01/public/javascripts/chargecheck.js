$(function() {
    $(".participate_price").hide();
    $(".charge_incharge").click(function(){
      $(".participate_price").show();
    });
    $(".charge-free").click(function(){
      $(".participate_price").hide();
    });
  });