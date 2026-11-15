'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyStateView } from '@/components/shop/FeatureErrorView';
import { HintToast } from '@/components/shop/HintToast';
import { AppPromoBanner } from '@/components/shop/AppPromoBanner';
import { MachineHeroCard } from '@/components/shop/MachineHeroCard';
import { useCanGoBack } from '@/hooks/useCanGoBack';
import { useHintToast } from '@/hooks/useHintToast';
import { useShelfScroll } from '@/hooks/useShelfScroll';
import { useMachineCart } from '@/hooks/useMachineCart';
import { payUrlFor } from '@/utils/guest-cart-url';
import { addButtonMode, visibleProducts, wholeShelfId } from '@/utils/menu-view';
import { AppOnlySheet } from './AppOnlySheet';
import { CartBar } from './CartBar';
import { CartSheet } from './CartSheet';
import { CategoryChips } from './CategoryChips';
import { HealthSheet } from './HealthSheet';
import { MachineAppBar } from './MachineAppBar';
import { NoSearchResults, ProductGrid } from './ProductGrid';
import { ProductPage } from './ProductPage';
import type { GuestMenu, GuestMenuProduct } from '@/types/guest-menu';

type Overlay = { kind: 'health'; rating: number | null } | { kind: 'app'; reason: 'offer' | 'checkout' };

function urlWithProduct(key: string | null): string {
  const url = new URL(window.location.href);
  if (key) url.searchParams.set('product', key);
  else url.searchParams.delete('product');
  return `${url.pathname}${url.search}`;
}

function ShelfBody({ menu, products, searching }: { menu: GuestMenu; products: GuestMenuProduct[]; searching: boolean }) {
  if (menu.products.length === 0) {
    return <EmptyStateView title="Nothing stocked right now" message="This machine has no products loaded. Try another machine nearby." />;
  }
  if (products.length > 0) return null;
  if (searching) return <NoSearchResults />;
  return (
    <EmptyStateView
      title="Nothing in this category"
      message="Pick another category from the ones above to see what this machine has."
    />
  );
}

export function MachineShelf({ menu, productKey }: { menu: GuestMenu; productKey: string | null }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const { toast, show } = useHintToast();
  const cart = useMachineCart(menu, show);
  const [search, setSearch] = useState<{ open: boolean; query: string }>({ open: false, query: '' });
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const pushedProduct = useRef(false);
  const { heroRef, chipsRef } = useShelfScroll();

  const query = search.open ? search.query.trim() : '';
  const products = visibleProducts(menu.products, { categoryId, wholeShelfId: wholeShelfId(menu.categories), query });
  const product = productKey ? (menu.products.find((candidate) => candidate.key === productKey) ?? null) : null;
  const machineName = menu.machine.name ?? menu.machine.location ?? 'Vend IT machine';

  const openProduct = (next: GuestMenuProduct) => {
    pushedProduct.current = true;
    window.history.pushState(null, '', urlWithProduct(next.key));
  };
  const closeProduct = () => {
    if (pushedProduct.current) window.history.back();
    else window.history.replaceState(null, '', urlWithProduct(null));
    pushedProduct.current = false;
  };
  const checkout = (lines = cart.lines) => router.push(payUrlFor(menu.machine.id, lines));
  const onAdd = (next: GuestMenuProduct) => {
    if (addButtonMode(next) === 'claim') setOverlay({ kind: 'app', reason: 'offer' });
    else cart.add(next.productId);
  };
  const onBuy = (next: GuestMenuProduct, quantity: number) => {
    const lines = cart.buy(next.productId, quantity);
    if (lines && menu.checkout.open) checkout(lines);
    else if (lines) closeProduct();
  };
  const getApp = () => setOverlay({ kind: 'app', reason: 'checkout' });
  const showCart = cart.summary.units > 0;

  return (
    <div className="min-h-screen pb-36">
      <MachineAppBar
        title={machineName}
        onBack={canGoBack ? () => router.back() : undefined}
        searching={search.open}
        query={search.query}
        onQuery={(next) => setSearch({ open: true, query: next })}
        onSearch={(open) => {
          setSearch({ open, query: '' });
          if (open) window.scrollTo(0, 0);
        }}
      />
      <div className="bg-white px-5 pb-2.5 pt-3">
        <div ref={heroRef} className="origin-top">
          <MachineHeroCard name={machineName} location={menu.machine.location} imageUrl={menu.machine.imageUrl} />
        </div>
        {!search.open && <AppPromoBanner place="machine" className="mt-3" />}
      </div>
      {!search.open && menu.categories.length > 0 && (
        <CategoryChips ref={chipsRef} categories={menu.categories} selectedId={categoryId} onSelect={setCategoryId} />
      )}
      <ShelfBody menu={menu} products={products} searching={query.length > 0} />
      <ProductGrid
        key={`${categoryId ?? 'all'}:${query}`}
        products={products}
        countOf={(item) => (item.guestBuyable ? cart.unitsOf(item.productId) : 0)}
        onOpen={openProduct}
        onAdd={onAdd}
        onHealthInfo={(item) => setOverlay({ kind: 'health', rating: item.healthRating })}
      />
      {showCart && !cartOpen && (
        <CartBar cart={cart.summary} open={false} onToggle={() => setCartOpen(true)} onCheckout={() => checkout()} onGetApp={getApp} />
      )}
      {showCart && cartOpen && (
        <CartSheet
          cart={cart.summary}
          onClose={() => setCartOpen(false)}
          onCheckout={() => checkout()}
          onGetApp={getApp}
          onIncrease={cart.add}
          onDecrease={cart.decrease}
        />
      )}
      {product && (
        <ProductPage
          key={product.key}
          product={product}
          initialQuantity={Math.max(cart.unitsOf(product.productId), 1)}
          canCheckout={menu.checkout.open}
          onClose={closeProduct}
          onBuy={(quantity) => onBuy(product, quantity)}
          onClaim={() => setOverlay({ kind: 'app', reason: 'offer' })}
          canStepTo={(quantity) => cart.canStepTo(product.productId, quantity)}
        />
      )}
      {overlay?.kind === 'health' && <HealthSheet rating={overlay.rating} onClose={() => setOverlay(null)} />}
      {overlay?.kind === 'app' && <AppOnlySheet reason={overlay.reason} onClose={() => setOverlay(null)} />}
      <HintToast toast={toast} />
    </div>
  );
}
