import { createRef, ReactNode, RefObject, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';

const dialogMap = new Map<number, RefObject<HTMLDialogElement>>();

class DialogController {
  private root?: Root;

  private createRoot() {
    if (this.ref.current != null)
      this.root = createRoot(this.ref.current);
  }

  constructor(private ref: RefObject<HTMLDialogElement>) {

  }

  public showModal(node: ReactNode) {

    if (this.root === undefined) {
      this.createRoot();
    }
    this.root!.render(<>{node}</>);
    this.ref.current!.showModal();
  }

  public close() {
    this.ref.current!.close();
  }
}

export function useDialog(dialogId: number) {
  const ref = dialogMap.get(dialogId);
  if (ref === undefined) {
    throw new Error(`dialogId: ${dialogId} is undefined`);
  }

  return new DialogController(ref);
}

export interface DialogProps {
  dialogId: number;
}
export function Dialog({ dialogId }: DialogProps) {

  const dialogRef = createRef<HTMLDialogElement>();
  dialogMap.set(dialogId, dialogRef);
  console.log('dialogMap registered', dialogId);

  useEffect(() => {
    return () => {
      dialogMap.delete(dialogId);
    }
  }, [dialogId]);

  return <dialog ref={dialogRef} className='bg-white'>
  </dialog>
}
