import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import authService from "@/services/authService";

function ForgotPasswordPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email của bạn");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      toast.success(response?.message || "Kiểm tra email của bạn để tiếp tục");
      setSubmitted(true);
    } catch (error: any) {
      const message = error?.message || "Không thể gửi yêu cầu, vui lòng thử lại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className={cn("w-full max-w-xl", className)} {...props}>
        <Card className="overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <form className="p-8 md:p-12" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col gap-2 mb-8">
                  <h1 className="text-4xl font-bold text-foreground">Quên mật khẩu</h1>
                  <p className="text-muted-foreground text-base">
                    Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.
                  </p>
                </div>

                <div className="bg-muted/30 border-2 border-border rounded-2xl p-6 space-y-5 mb-6">
                  <Field>
                    <FieldLabel htmlFor="email" className="text-base font-semibold">
                      Email
                    </FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="bg-background border-input h-14 text-base px-4"
                      disabled={loading || submitted}
                    />
                    <FieldDescription className="text-sm mt-1">
                      Chúng tôi sẽ gửi liên kết đặt lại mật khẩu tới email này nếu tài khoản tồn tại.
                    </FieldDescription>
                  </Field>
                </div>

                <Field>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base font-semibold"
                    disabled={loading || submitted}
                  >
                    {loading ? "Đang gửi..." : submitted ? "Đã gửi hướng dẫn" : "Gửi hướng dẫn"}
                  </Button>
                </Field>

                {submitted ? (
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-sm text-primary">
                    <p className="font-semibold mb-1">Đã gửi yêu cầu!</p>
                    <p>
                      Kiểm tra hộp thư (và cả thư rác) để tìm email hướng dẫn. Nếu không nhận được, bạn
                      có thể thử lại sau vài phút.
                    </p>
                  </div>
                ) : null}

                <FieldDescription className="text-center text-base mt-8">
                  Nhớ mật khẩu?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Quay lại đăng nhập
                  </button>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;


