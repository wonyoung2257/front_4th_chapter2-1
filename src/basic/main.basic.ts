import { renderCartProducts } from './components/CartProducts/CartProducts';
import { renderCartTotal, renderDiscount } from './components/CartTotal/CartTotal';
import { Header } from './components/Header/Header';
import { products } from './data/product';
import { calculateFinalAmount } from './services/calcProductDiscount';
import { Cart } from './stores/cart.store';
import { createElement } from './utils/createElement';
import { $ } from './utils/dom.utils';
import { updateSelectOptions } from './utils/select.utils';

let lastSel,
  bonusPoint = 0;

function main() {
  const $root = document.getElementById('app');
  const $container = createElement('div', {
    className: 'bg-gray-100 p-8',
  });
  const $wrap = createElement('div', {
    id: 'cart-wrap',
    className: 'max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8',
  });
  const $select = createElement<HTMLSelectElement>('select', {
    id: 'product-select',
    className: 'border rounded p-2 mr-2',
  });

  const $addToCartButton = createElement('button', {
    id: 'add-to-cart',
    className: 'bg-blue-500 text-white px-4 py-2 rounded',
    textContent: '추가',
  });

  const $cartProductList = createElement('div', {
    id: 'cart-items',
  });

  const $totalPrice = createElement('div', {
    id: 'cart-total',
    className: 'text-xl font-bold my-4',
  });

  const $stockStatus = createElement('div', {
    id: 'stock-status',
    className: 'text-sm text-gray-500 mt-2',
  });

  updateSelectOptions($select, products);

  $wrap.appendChild(Header());
  $wrap.appendChild($cartProductList);
  $wrap.appendChild($totalPrice);
  $wrap.appendChild($select);
  $wrap.appendChild($addToCartButton);
  $wrap.appendChild($stockStatus);
  $container.appendChild($wrap);
  $root.appendChild($container);

  renderCartSummary();
  setTimeout(function () {
    setInterval(function () {
      const luckyItem = products[Math.floor(Math.random() * products.length)];

      if (Math.random() < 0.3 && luckyItem.quantity > 0) {
        luckyItem.originalPrice = Math.round(luckyItem.originalPrice * 0.8);
        // alert('번개세일! ' + luckyItem.name + '이(가) 20% 할인 중입니다!');
        updateSelectOptions($select, products);
      }
    }, 30000);
  }, Math.random() * 10000);

  setTimeout(function () {
    setInterval(function () {
      if (lastSel) {
        const suggest = products.find(function (item) {
          return item.id !== lastSel && item.quantity > 0;
        });

        if (suggest) {
          // alert(suggest.name + '은(는) 어떠세요? 지금 구매하시면 5% 추가 할인!');
          suggest.originalPrice = Math.round(suggest.originalPrice * 0.95);
          updateSelectOptions($select, products);
        }
      }
    }, 60000);
  }, Math.random() * 20000);
}

const renderCartSummary = () => {
  const { amount, discountRate } = calculateFinalAmount(Cart.items);
  const $cartTotal = $('#cart-total');

  renderCartTotal($cartTotal, amount);
  renderDiscount($cartTotal, discountRate);
  renderProductStock();
  renderBonusPoint(amount);
};

const renderBonusPoint = (totalAmount: number) => {
  bonusPoint = Math.floor(totalAmount / 1000);
  let pointTag = document.getElementById('loyalty-points');

  if (!pointTag) {
    pointTag = document.createElement('span');
    pointTag.id = 'loyalty-points';
    pointTag.className = 'text-blue-500 ml-2';
    $('#cart-total').appendChild(pointTag);
  }
  pointTag.textContent = '(포인트: ' + bonusPoint + ')';
};

const renderProductStock = () => {
  let stockStatusMessage = '';

  products.forEach((item) => {
    if (item.quantity < 5) {
      stockStatusMessage += `${item.name}: ${
        item.quantity > 0 ? `재고 부족 (${item.quantity}개 남음)` : '품절'
      }\n`;
    }
  });
  $('#stock-status').textContent = stockStatusMessage;
};

main();

$('#add-to-cart').addEventListener('click', () => {
  const $select = $<HTMLSelectElement>('#product-select');
  const selectedItem = $select.value;
  const itemToAdd = products.find((item) => item.id === selectedItem);
  const $cartProductList = $('#cart-items');

  if (itemToAdd && itemToAdd.quantity > 0) {
    Cart.addItem(itemToAdd);
    itemToAdd.quantity--;
    renderCartProducts($cartProductList, Cart.items);
  } else {
    alert('재고가 부족합니다.');
  }
  renderCartSummary();
  lastSel = selectedItem;
});

$('#cart-items').addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  if (target.classList.contains('quantity-change') || target.classList.contains('remove-item')) {
    const productId = target.dataset.productId;
    const $product = document.getElementById(productId);
    const selectedProduct = products.find((product) => product.id === productId);

    if (target.classList.contains('quantity-change')) {
      const quantityDelta = parseInt(target.dataset.change);
      const newQuantity =
        parseInt($product.querySelector('span').textContent.split('x ')[1]) + quantityDelta;

      if (
        newQuantity > 0 &&
        newQuantity <=
          selectedProduct.quantity +
            parseInt($product.querySelector('span').textContent.split('x ')[1])
      ) {
        $product.querySelector('span').textContent =
          $product.querySelector('span').textContent.split('x ')[0] + 'x ' + newQuantity;
        selectedProduct.quantity -= quantityDelta;
      } else if (newQuantity <= 0) {
        $product.remove();
        selectedProduct.quantity -= quantityDelta;
      } else {
        alert('재고가 부족합니다.');
      }
    } else if (target.classList.contains('remove-item')) {
      const removedQuantity = parseInt($product.querySelector('span').textContent.split('x ')[1]);

      selectedProduct.quantity += removedQuantity;
      $product.remove();
    }
    renderCartSummary();
  }
});
