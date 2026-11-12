import { useRef, useLayoutEffect, useState, useCallback } from 'react';

/**
 * Custom hook to provide smooth FLIP (First, Last, Invert, Play) table row animations
 * when tasks are toggled between Incomplete and Completed statuses, causing them to move
 * up or down in the sorted hierarchy, while strictly preserving the user's scroll position
 * and preventing browser focus from forcibly jumping/scrolling the page.
 *
 * @param {Array|any} dataDependency - The task list or dependency that triggers re-render
 * @returns {Object} { registerRow, triggerRowAnimation, movingTaskInfo }
 */
export function useTableFlipAnimation(dataDependency) {
  const rowElementsRef = useRef(new Map());
  const lastPositionsRef = useRef(null);
  const scrollPositionRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);
  const [movingTaskInfo, setMovingTaskInfo] = useState(null);

  // Callback ref to attach to each <tr>: ref={registerRow(task.id)}
  const registerRow = useCallback((id) => (el) => {
    if (el) {
      rowElementsRef.current.set(String(id), el);
    } else {
      rowElementsRef.current.delete(String(id));
    }
  }, []);

  // Call this right before triggering the state change that causes the row to reorder
  const triggerRowAnimation = useCallback((taskId, direction) => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    // 1. Release active element focus so the browser does not scroll viewport to follow focused button
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    // 2. Lock current page scroll position
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft || window.scrollX || 0;
    scrollPositionRef.current = { x: scrollX, y: scrollY };

    // 3. Capture initial positions of all currently mounted rows in the table
    const snapshot = new Map();
    rowElementsRef.current.forEach((el, id) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        snapshot.set(id, rect.top);
      }
    });

    lastPositionsRef.current = snapshot;
    setMovingTaskInfo({
      id: String(taskId),
      direction: direction || 'down'
    });
  }, []);

  useLayoutEffect(() => {
    // Preserve and lock scroll position so page NEVER jumps or scrolls to top/bottom
    if (scrollPositionRef.current) {
      const { x, y } = scrollPositionRef.current;
      window.scrollTo(x, y);
    }

    if (!lastPositionsRef.current) return;

    const snapshot = lastPositionsRef.current;
    lastPositionsRef.current = null; // Consume snapshot so we only animate on intentional reorders

    const targetId = movingTaskInfo?.id;
    const elementsToAnimate = [];

    // Calculate deltaY for each row that changed vertical position
    rowElementsRef.current.forEach((el, id) => {
      if (!el) return;
      const oldTop = snapshot.get(id);
      if (oldTop !== undefined) {
        const newTop = el.getBoundingClientRect().top;
        const deltaY = oldTop - newTop;

        if (Math.abs(deltaY) > 2) {
          // INVERT: Immediately move row back to previous position with zero transition
          el.style.transform = `translate3d(0, ${deltaY}px, 0)`;
          el.style.transition = 'none';

          if (id === targetId) {
            el.style.zIndex = '35';
            el.style.position = 'relative';
          } else {
            el.style.zIndex = '1';
            el.style.position = 'relative';
          }

          elementsToAnimate.push({ el, id });
        }
      }
    });

    if (elementsToAnimate.length === 0) {
      setMovingTaskInfo(null);
      return;
    }

    // Force DOM reflow so the browser registers the inverted initial position
    void document.body.offsetHeight;

    // PLAY: in the next animation frames, smoothly animate everyone to their final slots
    requestAnimationFrame(() => {
      // Re-assert scroll position
      if (scrollPositionRef.current) {
        const { x, y } = scrollPositionRef.current;
        window.scrollTo(x, y);
      }

      requestAnimationFrame(() => {
        // Re-assert scroll position
        if (scrollPositionRef.current) {
          const { x, y } = scrollPositionRef.current;
          window.scrollTo(x, y);
        }

        elementsToAnimate.forEach(({ el, id }) => {
          const isTarget = id === targetId;
          // Target row that was toggled gets a silky spring glide curve; other rows slide to make room
          el.style.transition = isTarget
            ? 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 550ms cubic-bezier(0.25, 1, 0.5, 1)';
          el.style.transform = 'translate3d(0, 0, 0)';
        });
      });
    });

    // Cleanup inline styles and glowing status once animation completes
    cleanupTimeoutRef.current = setTimeout(() => {
      rowElementsRef.current.forEach((el) => {
        if (el) {
          el.style.transform = '';
          el.style.transition = '';
          el.style.zIndex = '';
          el.style.position = '';
        }
      });
      setMovingTaskInfo(null);
      scrollPositionRef.current = null;
    }, 750);

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [dataDependency, movingTaskInfo]);

  return {
    registerRow,
    triggerRowAnimation,
    movingTaskInfo
  };
}
