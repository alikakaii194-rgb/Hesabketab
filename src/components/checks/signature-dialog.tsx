
import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signature: string) => void;
  title?: string;
  description?: string;
}

export const SignatureDialog: React.FC<SignatureDialogProps> = ({ open, onOpenChange, onConfirm, title, description }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsDrawing(false);
  };

  const handleConfirm = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        // If it's empty, explicitly pass an empty string to indicate no signature
        onConfirm('');
      } else {
        const signatureImage = sigCanvas.current.toDataURL('image/png');
        onConfirm(signatureImage);
      }
      handleClear(); 
      onOpenChange(false);
    }
  };
  
  const handleBeginDrawing = () => {
      setIsDrawing(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title || 'لطفا امضا کنید'}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="relative w-full h-48 rounded-md border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <SignatureCanvas
            ref={sigCanvas}
            penColor='black'
            canvasProps={{ className: 'w-full h-full' }}
            onBegin={handleBeginDrawing}
          />
          {!isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-muted-foreground text-sm">در این کادر امضای خود را رسم کنید</p>
              </div>
          )}
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button onClick={handleClear} variant="outline">
            پاک کردن
          </Button>
          <Button onClick={handleConfirm}>
            تایید و ذخیره امضا
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
