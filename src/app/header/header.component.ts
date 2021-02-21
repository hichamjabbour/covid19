import {Component, OnDestroy, OnInit} from '@angular/core';
import firebase from 'firebase';
import {LoginService} from '../services/Login/login.service';
import {User} from '../shared/GoogleUser';
import {StringBuilder} from 'typescript-string-operations';
import {Subscription} from 'rxjs';
declare var $: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit , OnDestroy {
  public googleUser?: firebase.User|null;
  public user?: User|null;
  public sub?: Subscription;

  constructor(public loginService: LoginService) {

  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    }

  public  checkUserRoles(displayName: string | null | undefined , user: User): void{
    // tslint:disable-next-line:max-line-length
    if (displayName !== null && displayName !== undefined && user !== null && user !== undefined && this.loginService.canEdit(user)) {
      $('#addNews')[0].style.display = 'block';
    } else {
      $('#addNews')[0].style.display = 'none';
    }
  }


  ngOnInit(): void {

    this.sub = this.loginService.fire.authState.subscribe( data => {
      this.googleUser = data;
      const displayName = data?.displayName;
      const user =  this.loginService.user$?.getValue()?._value;
      this.checkUserRoles(displayName , user);
      if (displayName !== null &&  displayName !== undefined)
      {
        const str  = new StringBuilder('Welcome ');
        str.Append(displayName);
        $('#welcome')[0].innerHTML = str.ToString();
        $('#signIn').html('Sign Out');
      }
    });

    this.loginService.googleUser?.asObservable().subscribe(data => this.googleUser);
  }

  addNews(): void{
    $('#news')[0].style.display = 'block';
    $('#newsModal').modal('show');
  }


  signInOut(): void{
    const text = $('#signIn').html();

    switch (text) {
      case 'Sign In':
        $('#login')[0].style.display = 'block';
        $('#loginModal').modal('show');
        break;
      case 'Sign Out':
        firebase.auth().signOut().then(() => {
          // Sign-out successful.
          $('#signIn').html('Sign In');
          $('#user')[0].style.display = 'none';
          $('#addNews')[0].style.display = 'none';
          $('#welcome')[0].innerHTML = '';
          $('#close').click();
          localStorage.removeItem('user');
          localStorage.removeItem('firestoreUser');
        }).catch((error) => {
          // An error happened.
          $('#close').click();
        });
        break;
    }
  }


}
