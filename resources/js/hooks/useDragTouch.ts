import * as React from 'react';

type EndHandler = (
  payload: any,
  dropPayload: any | null,
  dropTarget: Element | null,
  event: Event,
) => void;

export function useDragTouch({
  onStart,
  onMove,
  onEnd,
}: {
  onStart?: (payload: any, event: Event) => void;
  onMove?: (payload: any, event: Event) => void;
  onEnd?: EndHandler;
} = {}) {
  const dragging = React.useRef(false);
  const ghostEl = React.useRef<HTMLElement | null>(null);
  const payloadRef = React.useRef<any>(null);

  function createGhost(target: HTMLElement): HTMLElement {
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.opacity = '0.5';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.width = `${target.offsetWidth}px`;
    clone.style.height = `${target.offsetHeight}px`;
    document.body.appendChild(clone);
    return clone;
  }
  function moveGhost(x: number, y: number) {
    if (!ghostEl.current) return;
    ghostEl.current.style.left = `${x - ghostEl.current.offsetWidth * 0.9}px`;
    ghostEl.current.style.top = `${y - ghostEl.current.offsetHeight * 0.9}px`;
  }
  function cleanup(target?: HTMLElement | null) {
    if (target) target.style.opacity = '';
    if (ghostEl.current?.parentNode) ghostEl.current.parentNode.removeChild(ghostEl.current);
    ghostEl.current = null;
    dragging.current = false;
  }
  function getDropPayload(dropEl: Element | null): [Element | null, any | null] {
    if (dropEl && !(dropEl as HTMLElement).hasAttribute('data-drop-payload')) {
      dropEl = dropEl.closest('[data-drop-payload]');
    }
    if (!dropEl) return [null, null];
    try {
      const raw = (dropEl as HTMLElement).getAttribute('data-drop-payload');
      return [dropEl, raw ? JSON.parse(raw) : null];
    } catch {
      return [dropEl, null];
    }
  }

  function dropHandler(dropPayload: object | null = null) {
    return {
      'data-drop-payload': dropPayload ? JSON.stringify(dropPayload) : '',
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDragEnter: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const dropTarget = e.target as Element;
        if (!dragging.current) return;
        const [, parsed] = getDropPayload(dropTarget);
        const payload = payloadRef.current;
        if (onEnd) onEnd(payload, parsed, dropTarget, (e as unknown) as Event);
        payloadRef.current = null;
        dragging.current = false;
      },
    } as const;
  }

  function dragTouchHandlers(getPayload: () => any) {
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        const data = getPayload();
        payloadRef.current = data;
        dragging.current = true;
        try {
          e.dataTransfer?.setData('application/json', JSON.stringify(data));
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
            e.dataTransfer.effectAllowed = 'move';
          }
        } catch {}
        if (onStart) onStart(data, (e as unknown) as Event);
      },
      onDragEnd: (e: React.DragEvent) => {
        if (!dragging.current) return;
        const payload = payloadRef.current;
        cleanup(e.currentTarget as HTMLElement);
        if (onEnd) onEnd(payload, null, null, (e as unknown) as Event);
        payloadRef.current = null;
      },
      onTouchStart: (e: React.TouchEvent) => {
        const data = getPayload();
        payloadRef.current = data;
        dragging.current = true;
        const touch = e.touches[0];
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.33';
        ghostEl.current = createGhost(target);
        moveGhost(touch.clientX, touch.clientY);
        if (onStart) onStart(data, (e as unknown) as Event);
      },
      onTouchMove: (e: React.TouchEvent) => {
        if (!dragging.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        moveGhost(touch.clientX, touch.clientY);
        if (onMove) onMove(payloadRef.current, (e as unknown) as Event);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        if (!dragging.current) return;
        dragging.current = false;
        const touch = e.changedTouches[0];
        const target = e.currentTarget as HTMLElement | null;
        const payload = payloadRef.current;
        cleanup(target || undefined);
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        const [dropEl, dropPayload] = getDropPayload(dropTarget);
        if (onEnd) onEnd(payload, dropPayload, dropEl, (e as unknown) as Event);
        payloadRef.current = null;
      },
    } as const;
  }

  return { dragTouchHandlers, dropHandler };
}
