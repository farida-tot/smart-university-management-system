import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { InstructorService } from '../../core/services/instructor';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly instructorService = inject(InstructorService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  user = this.auth.currentUser();
  instructor: any = null;
  currentPassword = '';
  newPassword = '';
  name = '';
  email = '';
  message = '';
  error = '';

  ngOnInit() {
    if (this.user?.role === 'instructor') {
      this.instructorService.getMyProfile().subscribe({ next: profile => { this.instructor = profile; this.name = profile.userId?.name ?? ''; this.email = profile.userId?.email ?? ''; this.changeDetector.markForCheck(); }, error: error => this.showError(error) });
    }
  }

  changePassword() {
    this.clearFeedback();
    if (this.newPassword.length < 6) { this.error = 'New password must be at least 6 characters.'; return; }
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.message = 'Password changed successfully.';
        this.currentPassword = '';
        this.newPassword = '';
        this.changeDetector.markForCheck();
      },
      error: error => this.showError(error)
    });
  }

  saveInstructorProfile() {
    this.clearFeedback();
    this.instructorService.updateMyProfile({ name: this.name, email: this.email }).subscribe({ next: () => { this.message = 'Profile updated successfully.'; }, error: error => this.showError(error) });
  }

  private clearFeedback() { this.message = ''; this.error = ''; }
  private showError(error: any) { this.error = error.error?.message ?? 'Unable to complete the request.'; this.changeDetector.markForCheck(); }
}
