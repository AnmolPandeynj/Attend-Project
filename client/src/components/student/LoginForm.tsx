import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';

const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Please select country code'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'Please enter the complete OTP'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OTPForm = z.infer<typeof otpSchema>;

interface StudentLoginFormProps {
  onSuccess: () => void;
}

export const StudentLoginForm = ({ onSuccess }: StudentLoginFormProps) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const { toast } = useToast();
  const { login } = useAuth();
  
  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: '+91',
      phoneNumber: '',
    },
  });

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSendOTP = async (data: PhoneForm) => {
    setIsLoading(true);
    try {
      const fullPhoneNumber = data.countryCode + data.phoneNumber;
      
      // For demo purposes, generate a mock OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(otp);
      setPhoneNumber(fullPhoneNumber);
      setStep('otp');
      
      toast({
        title: "OTP Sent",
        description: `Demo OTP: ${otp} (In production, this would be sent via SMS)`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const onVerifyOTP = async (data: OTPForm) => {
    setIsLoading(true);
    try {
      if (data.otp === generatedOTP) {
        const userData = {
          id: `student-${Date.now()}`,
          email: null,
          phoneNumber: phoneNumber,
          role: 'student' as const,
          name: `Student ${phoneNumber.slice(-4)}`,
          semester: 3,
          branch: 'Computer Science',
        };
        
        login(userData);
        
        toast({
          title: "Login Successful",
          description: "Welcome! Redirecting to dashboard...",
        });
        
        onSuccess();
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const resendOTP = async () => {
    const phoneData = phoneForm.getValues();
    await onSendOTP(phoneData);
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-student-login">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4" data-testid="icon-student">
          <GraduationCap className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Student Login</CardTitle>
        <p className="text-muted-foreground mt-2">
          {step === 'phone' 
            ? 'Enter your phone number to receive OTP'
            : 'Enter the verification code sent to your phone'
          }
        </p>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={phoneForm.handleSubmit(onSendOTP)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex">
                <Select 
                  value={phoneForm.watch('countryCode')} 
                  onValueChange={(value) => phoneForm.setValue('countryCode', value)}
                >
                  <SelectTrigger className="w-20" data-testid="select-country-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  className="flex-1 rounded-l-none border-l-0"
                  {...phoneForm.register('phoneNumber')}
                  data-testid="input-phone"
                />
              </div>
              {phoneForm.formState.errors.phoneNumber && (
                <p className="text-sm text-destructive">{phoneForm.formState.errors.phoneNumber.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
              data-testid="button-send-otp"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
            
            <div id="recaptcha-container"></div>
          </form>
        ) : (
          <div className="space-y-6">
            <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-6">
              <div className="space-y-4">
                <Label>Enter OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpForm.watch('otp')}
                    onChange={(value) => otpForm.setValue('otp', value)}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-destructive text-center">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
                data-testid="button-verify-otp"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
            
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive OTP? {' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={resendOTP}
                data-testid="button-resend-otp"
              >
                Resend
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
