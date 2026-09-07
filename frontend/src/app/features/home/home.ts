import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Student } from '../../core/services/student';

@Component({ selector: 'app-home', imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.css' })
export class Home {
	private readonly studentService = inject(Student);
	private readonly changeDetector = inject(ChangeDetectorRef);
	studentDashboard: any = null;

	ngOnInit() {
		if (localStorage.getItem('smart-university-token')) {
			this.studentService.getDashboard().subscribe({ next: data => { this.studentDashboard = data; this.changeDetector.markForCheck(); } });
		}
	}
}