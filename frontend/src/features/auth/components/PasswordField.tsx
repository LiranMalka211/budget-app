import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** Password input with a show/hide toggle button. */
export function PasswordField(props: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pe-10" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute end-1 top-1/2 -translate-y-1/2 text-muted-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}
